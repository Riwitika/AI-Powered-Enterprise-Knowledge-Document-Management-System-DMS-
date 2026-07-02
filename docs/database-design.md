# Database Schema & Data Model Specifications
## AI-Powered Enterprise Knowledge & Document Management System (DMS)
### Client Organization: Fast Trade Technologies Pvt. Ltd.
### Project Duration: 45 Days

---

## 1. System Overview
The DMS database uses **PostgreSQL 16** with the **`pgvector`** extension to handle both structured relational data (users, permissions, document catalogs) and unstructured vector embeddings for semantic RAG search.

---

## 2. Entity-Relationship Table Structures

### 2.1 Table: `roles`
Stores Role-Based Access Control scopes.
* **id:** `SERIAL` (Primary Key)
* **name:** `VARCHAR(50)` (Unique, e.g. `'super_admin'`, `'employee'`)
* **description:** `TEXT`

### 2.2 Table: `departments`
Enforces organizational division boundaries.
* **id:** `SERIAL` (Primary Key)
* **name:** `VARCHAR(100)` (Unique)
* **parent_id:** `INTEGER` (Foreign Key -> `departments.id`, nullable for root departments)

### 2.3 Table: `users`
System user profiles.
* **id:** `UUID` (Primary Key, default: `gen_random_uuid()`)
* **full_name:** `VARCHAR(150)`
* **email:** `VARCHAR(255)` (Unique)
* **hashed_password:** `VARCHAR(255)`
* **role_id:** `INTEGER` (Foreign Key -> `roles.id`)
* **department_id:** `INTEGER` (Foreign Key -> `departments.id`, nullable)
* **created_at:** `TIMESTAMP`

### 2.4 Table: `folders`
Hierarchical catalog directory tree.
* **id:** `SERIAL` (Primary Key)
* **name:** `VARCHAR(150)`
* **parent_id:** `INTEGER` (Foreign Key -> `folders.id`, nullable for root folders)
* **created_at:** `TIMESTAMP`

### 2.5 Table: `documents`
Main files repository database.
* **id:** `UUID` (Primary Key, default: `gen_random_uuid()`)
* **folder_id:** `INTEGER` (Foreign Key -> `folders.id`, nullable)
* **name:** `VARCHAR(255)`
* **description:** `TEXT`
* **file_path:** `VARCHAR(512)`
* **file_type:** `VARCHAR(20)` (e.g. `'pdf'`, `'docx'`)
* **category:** `VARCHAR(100)` (e.g. `'SOP'`, `'Contract'`)
* **access_level:** `VARCHAR(50)` (default: `'private'`, options: `'private'`, `'view_only'`, `'edit'`, `'department'`, `'organization'`, `'custom'`)
* **owner_id:** `UUID` (Foreign Key -> `users.id`)
* **current_version:** `INTEGER` (default: `1`)
* **ai_summary:** `TEXT` (Automatic executive abstract)
* **ai_keywords:** `VARCHAR(100)[]` (Extracted list of tags)
* **created_at:** `TIMESTAMP`
* **updated_at:** `TIMESTAMP`

### 2.6 Table: `document_versions`
Historical record of file revisions.
* **id:** `SERIAL` (Primary Key)
* **document_id:** `UUID` (Foreign Key -> `documents.id` on delete cascade)
* **version_number:** `INTEGER`
* **file_path:** `VARCHAR(512)`
* **uploaded_at:** `TIMESTAMP`

### 2.7 Table: `permissions`
Custom fine-grained sharing policies.
* **id:** `SERIAL` (Primary Key)
* **document_id:** `UUID` (Foreign Key -> `documents.id` on delete cascade)
* **user_id:** `UUID` (Foreign Key -> `users.id`, nullable)
* **department_id:** `INTEGER` (Foreign Key -> `departments.id`, nullable)
* **access_type:** `VARCHAR(20)` (options: `'view'`, `'edit'`)

### 2.8 Table: `document_chunks`
Broke-down text slices for RAG search.
* **id:** `SERIAL` (Primary Key)
* **document_id:** `UUID` (Foreign Key -> `documents.id` on delete cascade)
* **content:** `TEXT` (Raw text chunk)
* **chunk_index:** `INTEGER`
* **embedding:** `VECTOR(1536)` (Holds 1536-dimensional OpenAI embeddings, or `VECTOR(384)` for Sentence-Transformers)

### 2.9 Table: `ai_conversations`
Audit logs of user conversational exchanges.
* **id:** `SERIAL` (Primary Key)
* **user_id:** `UUID` (Foreign Key -> `users.id`)
* **question:** `TEXT`
* **answer:** `TEXT`
* **source_document_ids:** `UUID[]` (List of referenced source IDs)
* **created_at:** `TIMESTAMP`

---

## 3. Database Indexes & Performance Optimization
To guarantee search speeds under a high volume of documents, the following indexes are configured:
1. **Vector Similarity Index:** An `HNSW` (Hierarchical Navigable Small World) index is created on `document_chunks.embedding` using cosine distance:
   ```sql
   CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
   ```
2. **Foreign Key Indices:** Standard B-Tree indexes on all foreign key constraints (`documents.folder_id`, `permissions.document_id`, `document_chunks.document_id`) to accelerate cascade deletions and metadata resolution.
3. **Hierarchical Recursion:** Indices on `folders.parent_id` and `departments.parent_id` for recursive query traversal of tree nodes.
