# Multimodal Vision Chatbot

A FastAPI backend and React frontend for asking questions about one uploaded image. The backend uses Groq's OpenAI-compatible API and the `qwen/qwen3.8-27b` vision model.

## Setup

1. Copy `.env.example` to `.env` and set `GROQ_API_KEY`.
2. Install backend packages:

```powershell
python -m pip install -r requirements.txt
```

3. Start the API from the project directory:

```powershell
uvicorn app:app --reload --port 8001
```

4. In a second terminal, start the React app:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## API

- `GET /api/health` returns `{ "status": "ok" }`.
- `POST /api/chat` accepts `{ "message": string, "history": [{ "role": "user" | "assistant", "content": string }], "image": string | null }` and returns `{ "response": string }`.

The frontend sends an image as a browser-generated data URL. The API key remains server-side and is never exposed to React.
