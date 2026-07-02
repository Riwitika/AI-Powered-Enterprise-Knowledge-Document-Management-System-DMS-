# Database Design Document
## Enterprise Knowledge & Document Management System (enterprise-kms)

### 1. Database Engine & Extensions
- **Engine**: PostgreSQL 16
- **Extension**: `pgvector` for embedding vector operations and indexing.

### 2. Entity-Relationship Diagram & Schema Description
- **roles**: Define system roles (super_admin, admin, etc.).
- **departments**: Department hierarchy (parent-child relationship).
- **users**: Accounts linked to a role and a department.
- **folders**: Virtual folder tree.
- **documents**: File reference, parent folder, access level, and AI summaries.
- **document_versions**: Keeps track of file revisions.
- **document_tags**: N-to-N tags for categorizing.
- **permissions**: Fine-grained access mappings for users/departments.
- **document_chunks**: Stores text chunks alongside 384-dimensional vector embeddings with a cosine index.
- **ai_conversations**: Chat logs for audit and context tracking.

### 3. Indexes & Performance Optimization
- Cosine index on `document_chunks.embedding` using `ivfflat`.
- Foreign key indexes for fast query resolution on folders and permissions.
