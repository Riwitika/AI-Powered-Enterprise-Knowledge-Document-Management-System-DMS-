# Fast Trade Enterprise Knowledge & Document Management System (DMS)

Fast Trade DMS is a secure, enterprise-grade Knowledge Management System (KMS) built with a FastAPI backend, a React + Vite frontend, and a local/cloud database setup. It features high-fidelity Google Docs style document editing, real-time collaboration comments, automated approval workflows, notifications, and an integrated AI assistant driven by a RAG (Retrieval-Augmented Generation) pipeline.

---

## 1. Features
*   **Docx & Text Editors**: Google Docs styled rich text editing with automatic local storage draft recovery and real-time backend persistence.
*   **Folder Tree & Explorer**: Recursive directory management supporting creation, renaming, moving, and deleting folders and subfolders.
*   **Version History**: Tracks modifications, saves incremental version diffs, and supports one-click version restoration.
*   **Real-time Comments**: Collaboration thread threads with support for replies, comment resolutions, and deletions.
*   **Approval Workflow**: Secure manager submission queues for documents requiring reviews prior to general organizational publication.
*   **AI Chat & Assistant**: Global chat and document-focused floating assistants providing RAG context search, summaries, and smart metadata suggestion.
*   **Audit Logging**: High-security, tamper-proof logs capturing sensitive logins, registration changes, and permissions edits.

---

## 2. Technical Stack
*   **Frontend**: React (v18), Vite, TypeScript, React Query (v5) for async caching, Zustand for global stores, and Tailwind CSS.
*   **Backend**: Python (v3.12), FastAPI (v0.111), SQLAlchemy ORM (v2.0), Pydantic (v2) schemas, and Pytest.
*   **Database**: SQLite (for local/testing development) and PostgreSQL (for production).
*   **AI / RAG**: Sentence-Transformers (`all-MiniLM-L6-v2`) for local embeddings generation and OpenAI API (`gpt-4o-mini`) for chat completions.

---

## 3. Project Architecture

### RAG (Retrieval-Augmented Generation) Workflow
```
[User Query] ──> [Sentence-Transformers Embedding]
                      │
                      ▼
             [SQLite/PG Vector Match] ──> [Top Context Chunks]
                                               │
                                               ▼
[System Prompt + Context + Query] ──> [OpenAI GPT-4o-mini API] ──> [User Answer]
```

### Folder Structure
```
enterprise-kms/
├── backend/
│   ├── app/
│   │   ├── api/            # API endpoints (auth, docs, users, comments, notifications)
│   │   ├── core/           # Configs, dependency injection, and JWT security rules
│   │   ├── db/             # Base session setup and SQLite uuid overrides
│   │   ├── models/         # SQLAlchemy models (cascade constraints and structures)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   └── services/       # RAG, storage, sanitizers, and audit logs
│   ├── tests/              # Pytest files (test_api.py, test_extended.py)
│   └── requirements.txt    # Python dependencies list
└── frontend/
    ├── src/
    │   ├── components/     # Layouts, editor components, trees, and charts
    │   ├── pages/          # Lazy-loaded page modules (Dashboard, DocxEditor, AIChat)
    │   ├── services/       # API clients and AI fetch handlers
    │   ├── stores/         # Zustand session/UI state stores
    │   └── utils/          # DOMParser HTML sanitizers
    ├── package.json        # Node scripts and bundle presets
    └── tsconfig.json       # TypeScript compiler setups
```

---

## 4. Required Environment Variables

### Backend Configurations (`backend/.env`)

| Variable | Description | Default / Development | Production Requirement |
| :--- | :--- | :--- | :--- |
| `ENV` | Application environment mode | `development` | `production` |
| `DATABASE_URL` | DB connection string | `sqlite:///./kms.db` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret | A development key | Must be a secure 32+ char token |
| `OPENAI_API_KEY` | OpenAI API integration key | None (Mock LLM mode) | Real OpenAI API Key |
| `OPENAI_MODEL` | GPT model selection | `gpt-4o-mini` | `gpt-4o-mini` or similar |
| `UPLOAD_DIR` | File upload storage directory | `./uploads` | Custom block storage path |
| `BACKEND_CORS_ORIGINS` | Permitted origins | Comma-separated hosts | Production frontend domains |

### Frontend Configurations (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Relative route for proxied backend endpoint | `/api/v1` |
| `VITE_BACKEND_URL` | Local uvicorn development proxy target | `http://localhost:8000/api/v1` |

---

## 5. Local Setup & Installation (Without Docker)

### Step A: Configure Backend Environment
1.  Navigate to `backend/` directory:
    ```bash
    cd backend
    ```
2.  Copy env example:
    ```bash
    cp .env.example .env
    ```
3.  Create a virtual environment and activate it:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Launch development server:
    ```bash
    ENV=development uvicorn app.main:app --host 127.0.0.1 --port 8000
    ```

### Step B: Configure Frontend Client
1.  Navigate to `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Copy env example:
    ```bash
    cp .env.example .env
    ```
3.  Install node packages:
    ```bash
    npm install
    ```
4.  Start development server:
    ```bash
    npm run dev
    ```

---

## 6. Running Tests
To run the full backend testing suites:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest
```

---

## 7. Cloud Deployment (Without Docker)
This project is pre-configured for a modern, split-client hosting topology:

### A. Deploy Frontend on Vercel
1.  Connect your GitHub repository to [Vercel](https://vercel.com).
2.  Set Root Directory to `frontend`.
3.  Set build parameters (Build: `npm run build`, Output: `dist`).
4.  Configure Environment Variable `VITE_API_URL` pointing to your deployed backend URL.
5.  Click Deploy.

### B. Deploy Backend on Render
1.  Connect your GitHub repository to [Render](https://render.com) and create a **Web Service**.
2.  Set Root Directory to `backend`.
3.  Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4.  Add environment variables (`ENV=production`, `DATABASE_URL` pointing to PostgreSQL database, `SECRET_KEY`, and `OPENAI_API_KEY`).
5.  Click Deploy.

---

## 8. Future Improvements
*   Implement real-time WebSockets collaborative concurrent editing inside the Docx Editor.
*   Support multi-language translation directly inside the Floating AI Assistant.
