# AI & Retrieval-Augmented Generation (RAG) Architecture
## AI-Powered Enterprise Knowledge & Document Management System (DMS)
### Client Organization: Fast Trade Technologies Pvt. Ltd.
### Project Duration: 45 Days

---

## 1. Grounded QA System Flow
The DMS implements a **Retrieval-Augmented Generation (RAG)** architecture. Instead of feeding sensitive corporate documents directly to a public LLM, documents are processed, sliced, and stored as vector embeddings in a private database. When a user asks a question, the system retrieves only the most relevant text slices to construct a secure, grounded context prompt for the LLM.

---

## 2. Document Processing Pipeline (Ingestion Flow)

```
[ Upload File ]
       │
       ▼
[ Text Extraction ] ── (OCR via Tesseract for scans, pdfplumber/docx parser for text)
       │
       ▼
[ Text Chunking ]   ── (RecursiveCharacterTextSplitter: size=1000, overlap=200)
       │
       ▼
[ Embedding Gen ]   ── (Sentence-Transformers "all-MiniLM-L6-v2" or OpenAI "text-embedding-3-small")
       │
       ▼
[ Vector Storage ]  ── (Stored in PostgreSQL with pgvector extension & HNSW Cosine indexing)
```

### 2.1 Extraction
* **Text Documents (.pdf, .docx, .txt):** Handled using python libraries (`pdfplumber`, `python-docx`).
* **Scanned Images / Graphic PDFs:** Parsed using OCR engines (`pytesseract` binding with system `Tesseract-OCR`) to extract textual strings.

### 2.2 Chunking
To prevent losing document context, raw text is divided using a **Recursive Character Text Splitter**:
* **Chunk Size:** 1,000 characters.
* **Chunk Overlap:** 200 characters (ensures text boundary semantics, such as mid-sentence splits, are preserved across adjacent chunks).

### 2.3 Embeddings
* Chunks are translated into numerical representations using a pre-trained embedding model (e.g. `all-MiniLM-L6-v2` generating 384-dimensional dense vectors, or OpenAI `text-embedding-3-small` generating 1536-dimensional vectors).

---

## 3. Query Execution & Answer Generation (Retrieval Flow)

```
[ User Query ] ──────► [ Generate Query Embedding ] 
                              │
                              ▼
[ LLM Generation ] ◄─── [ Fetch Top-K Chunks ] (restricted by user RBAC access rules)
       │
       ▼
[ Output Answer & Citation Links ]
```

1. **Query Embeddings:** The user's search query (e.g. *"What are the recruitment leave policies?"*) is embedded using the same vectorizer model.
2. **Access-Restricted Vector Search:** The database searches for the top-k chunks (typically `k=4`) using cosine similarity. Crucially, the query filter **injects permission checks** (RBAC):
   ```sql
   SELECT content, document_id, 1 - (embedding <=> :query_vector) AS similarity 
   FROM document_chunks 
   JOIN documents ON documents.id = document_chunks.document_id
   WHERE (documents.access_level = 'organization' 
          OR documents.owner_id = :current_user_id 
          OR documents.id IN (SELECT document_id FROM permissions WHERE user_id = :current_user_id))
   ORDER BY similarity DESC LIMIT 4;
   ```
3. **Context Construction:** The text contents of the retrieved chunks are formatted into a prompt:
   ```
   System Prompt: You are the Fast Trade Technologies Knowledge Assistant.
   Answer the User Query strictly using the provided Context block. If the answer cannot be found in the context, say "I cannot find the answer in the provided corporate files." Do not hallucinate.

   Context:
   ---
   [Chunk 1 Text] (Source: Leave Policies SOP)
   [Chunk 2 Text] (Source: Onboarding Handbook)
   ---

   User Query: [User's Question]
   ```
4. **Response & Citation Links:** The LLM generates the answer, and the backend returns it alongside the names and links of the source documents from which the chunks were retrieved, ensuring full auditability.
