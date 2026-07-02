# Functional Requirements Document (FRD)
## Enterprise Knowledge & Document Management System (enterprise-kms)

### 1. Functional Scope & Modules
- **Authentication**: User registration, login, logout, and token refresh.
- **User Management**: Role and department assignment by administrators.
- **Folder & Document Management**: Create, read, update, delete (CRUD) folders and documents. Move/reparent folders. Document version control.
- **Access Control & Permissions**: Private, view-only, edit, department, organization, and custom user-specific sharing.
- **RAG AI Assistant**: Document-scoped and organization-wide Q&A, source citation, and document chunking/embeddings generation.

### 2. External Interfaces & APIs
- **OpenAI API**: For answering questions using context fetched from documents.
- **Local Embedding Service**: Sentence-transformers for generating 384-dimensional vector embeddings of text chunks.
- **Database (PostgreSQL)**: pgvector extension for similarity search.

### 3. Non-Functional Requirements
- **Security**: Password hashing with bcrypt, JWT authorization tokens.
- **Performance**: Near-instant chunk retrieval using cosine index on vectors.
- **Usability**: Responsive web design using React, TailwindCSS, and shadcn-style component elements.
