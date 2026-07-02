# System Roadmap Document
## Enterprise Knowledge & Document Management System (enterprise-kms)

### Phase 1: MVP Release (Days 1-45)
- Basic folder and document CRUD.
- Role-based and document-level permission controls.
- Local document parsing, embedding generation, and pgvector cosine search.
- Org-wide and document-level AI chat.

### Phase 2: Production Scaling (Days 46-90)
- Migrate background parsing from FastAPI tasks to Celery with Redis broker.
- Shift local embeddings to high-throughput cloud model endpoints (e.g. OpenAI `text-embedding-3-small`).
- Replace local file storage with Amazon S3 or MinIO buckets.

### Phase 3: Advanced Features (Days 91+)
- Multi-lingual OCR using cloud vision models.
- Support for complex file formats like CAD drawing previews and large zip archives.
- User action audit logs and analytics graphs.
