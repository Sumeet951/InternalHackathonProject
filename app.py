import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))
INSTRUCTIONS = Path(__file__).with_name("instructions.txt").read_text(encoding="utf-8")
MODEL = "qwen/qwen3.8-27b"

app = FastAPI(title="Vision Chatbot API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_URL", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=20_000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    history: list[Message] = Field(default_factory=list, max_length=50)
    image: str | None = None


class ChatResponse(BaseModel):
    response: str


def get_client() -> OpenAI:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")
    return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    api_messages: list[dict] = [{"role": "system", "content": INSTRUCTIONS}]
    api_messages.extend(
        {"role": item.role, "content": item.content} for item in request.history
    )
    current_content: list[dict] = [{"type": "text", "text": request.message}]
    if request.image:
        if not request.image.startswith("data:image/"):
            raise HTTPException(status_code=400, detail="Image must be a data URL")
        current_content.append({"type": "image_url", "image_url": {"url": request.image}})
    api_messages.append({"role": "user", "content": current_content})

    try:
        result = get_client().chat.completions.create(
            model=MODEL, messages=api_messages, max_tokens=500
        )
        response = result.choices[0].message.content or "I could not generate a response."
        return ChatResponse(response=response)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Model request failed: {error}") from error
