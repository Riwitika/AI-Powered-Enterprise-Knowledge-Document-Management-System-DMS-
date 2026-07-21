# Fast Trade Enterprise Knowledge & Document Management System (DMS)

Fast Trade DMS is a secure, enterprise-grade Knowledge Management System built with a FastAPI backend and a React + Vite frontend. It features high-fidelity Google Docs style document editing, real-time collaboration comments, automated approval workflows, and an integrated AI assistant.

---

## 1. Required Environment Variables

To safeguard credentials and secrets, this project utilizes strict environment variable configuration. Both components have `.env.example` files.

### Backend Configurations (`backend/.env`)

| Variable | Description | Default / Development | Production Requirement |
| :--- | :--- | :--- | :--- |
| `ENV` | Application environment mode | `development` | `production` |
| `DEBUG` | Verbose debug logs | `true` | `false` |
| `DATABASE_URL` | DB connection string | `sqlite:///./kms.db` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret | A development key | Must be a secure 32+ char token |
| `ALGORITHM` | JWT hashing algorithm | `HS256` | `HS256` |
| `OPENAI_API_KEY` | OpenAI API integration key | None (Mock LLM mode) | Real OpenAI API Key |
| `OPENAI_MODEL` | GPT model selection | `gpt-4o-mini` | `gpt-4o-mini` or similar |
| `UPLOAD_DIR` | File upload storage directory | `./uploads` | Custom block storage path |
| `BACKEND_CORS_ORIGINS` | Permitted origins | Comma-separated dev hosts | Production frontend domains |

### Frontend Configurations (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Relative route for proxied backend endpoint | `/api/v1` |
| `VITE_BACKEND_URL` | Local uvicorn development proxy target | `http://localhost:8000/api/v1` |
| `VITE_DEV_BYPASS_AUTO_LOGIN` | Bypass auto-restoration check | `false` |

---

## 2. Setup & Installation

### Prerequisite Checklist
* Python 3.10+
* Node.js v18+
* npm or yarn

---

## 3. Development Setup

Follow these steps to initialize the application in development mode:

### Step A: Configure Backend Environment
1. Navigate to the `backend/` folder.
2. Copy the example configuration template:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set:
   ```env
   ENV=development
   DEBUG=true
   DATABASE_URL=sqlite:///./kms.db
   SECRET_KEY=dev-secret-key-12345
   ```

### Step B: Run Backend Services
1. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI development server:
   ```bash
   ENV=development DEBUG=true venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

### Step C: Configure Frontend Environment
1. Navigate to the `frontend/` folder.
2. Copy the example configuration template:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and verify the settings:
   ```env
   VITE_API_URL=/api/v1
   VITE_BACKEND_URL=http://localhost:8000/api/v1
   VITE_DEV_BYPASS_AUTO_LOGIN=false
   ```

### Step D: Run Frontend Client
1. Install node packages:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

---

## 4. Production Setup

In a production environment, the configuration loader enforces strict security validation:

1. SQLite is rejected (PostgreSQL is required).
2. The default placeholder `SECRET_KEY` is blocked.
3. A valid `OPENAI_API_KEY` is required.

### Step A: Configure Production Environment Variables
Create the production `.env` in the backend:
```env
ENV=production
DEBUG=false
DATABASE_URL=postgresql://postgres_user:strong_password@db_host:5432/kms_db
SECRET_KEY=YOUR_GENERATED_SECURE_SECRET_KEY
OPENAI_API_KEY=sk-proj-...
```

### Step B: Generate a Secure `SECRET_KEY`
You can generate a cryptographically secure token using Python's `secrets` module:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
Copy the printed hex output and paste it into the `SECRET_KEY` field of your production `.env` file.

### Step C: Build & Deploy
Compile the static build files for frontend hosting:
```bash
npm run build
```
Deploy the resulting `dist/` bundle through Nginx, Cloudflare, or AWS S3, routing `/api/v1` to the backend uvicorn process.
