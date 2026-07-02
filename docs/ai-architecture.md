# AI Architecture Document
## Enterprise Knowledge & Document Management System (enterprise-kms)

### 1. Document Extraction & Chunking Strategy
- Format-specific parsers:
  - PDF: PyMuPDF (`fitz`) for fast text extraction.
  - DOCX: `docx` library.
  - PPTX: `pptx` library.
  - XLSX: `openpyxl`.
  - Images: `pytesseract` OCR after grayscale conversion.
- Text splitting into chunks of ~500 tokens with 50-token overlap to maintain structural context.

### 2. Embedding Generation
- Model: `sentence-transformers/all-MiniLM-L6-v2` run locally.
- Output: 384-dimensional dense float vector.

### 3. Retrieval & RAG Pipeline
- Cosine similarity search via PostgreSQL `pgvector`.
- Pre-retrieval filtering: Injects the current user's accessible document list directly into the vector search SQL query.
- Chat prompt: Combines user query, retrieved context chunks, and instructions to ensure answers are fully grounded in the retrieved sources.
