import logging
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.models import Document, DocumentChunk, DocumentTag
from app.services.extraction import extract_document_text
from app.services.chunking import chunk_text
from app.services.embeddings import embedding_service
from app.services.rag import llm_provider

logger = logging.getLogger(__name__)

def process_document_upload(document_id: UUID, db: Session) -> None:
    logger.info(f"Starting background processing for document: {document_id}")
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        logger.error(f"Document {document_id} not found in database.")
        return

    try:
        # 1. Extract Text
        text = extract_document_text(doc.file_path, doc.file_type)
        if not text.strip():
            logger.warning(f"No text extracted from document {doc.name} ({document_id})")
            doc.ai_summary = "Empty document. No content to summarize."
            doc.ai_keywords = []
            db.commit()
            return
            
        logger.info(f"Extracted {len(text)} characters from {doc.name}")

        # 2. Generate Summary and Keywords via LLM
        summary, keywords = llm_provider.generate_summary_and_keywords(text)
        doc.ai_summary = summary
        doc.ai_keywords = keywords
        
        # Save tags to document_tags table
        # Delete existing tags first (in case of re-processing)
        db.query(DocumentTag).filter(DocumentTag.document_id == doc.id).delete()
        for tag in keywords:
            clean_tag = tag.strip().lower()[:50]
            if clean_tag:
                doc_tag = DocumentTag(document_id=doc.id, tag=clean_tag)
                db.add(doc_tag)
                
        db.commit()
        logger.info(f"Generated summary and tags for document {doc.name}")

        # 3. Chunk text
        chunks = chunk_text(text)
        logger.info(f"Split document into {len(chunks)} chunks.")

        # 4. Generate Embeddings and Save Chunks
        # Delete existing chunks first (in case of re-processing or new version)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        db.commit()

        # Batch encode to speed up embedding generation
        embeddings = embedding_service.get_embeddings(chunks)
        
        for idx, (chunk_content, emb) in enumerate(zip(chunks, embeddings)):
            db_chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                content=chunk_content,
                embedding=emb
            )
            db.add(db_chunk)
            
        db.commit()
        logger.info(f"Successfully chunked and embedded document {doc.name}")

    except Exception as e:
        logger.exception(f"Failed to process document {document_id}: {e}")
        doc.ai_summary = f"Error during processing: {str(e)}"
        db.commit()

def run_background_processing(document_id: UUID):
    db = SessionLocal()
    try:
        process_document_upload(document_id, db)
    finally:
        db.close()
