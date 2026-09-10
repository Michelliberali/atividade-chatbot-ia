"""
Backend do Chatbot com Inteligência Artificial.

Expõe uma API REST (FastAPI) com um endpoint POST /api/chat que recebe a
mensagem do usuário, conversa com a API do Google Gemini e devolve a resposta
gerada pela IA em formato JSON.
"""

import asyncio
import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

# Instrução de sistema: define a "personalidade" do chatbot.
SYSTEM_PROMPT = (
    "Você é um assistente virtual simpático e prestativo. "
    "Responda sempre em português do Brasil, de forma clara e objetiva. "
    "Não use formatação Markdown (nada de **, ##, listas com *); responda em texto simples."
)

app = FastAPI(title="Chatbot IA", version="1.0.0")

# Libera o frontend (Vite roda em localhost:5173) a chamar este backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Mensagem digitada pelo usuário")
    history: list[Message] = Field(
        default_factory=list, description="Histórico da conversa (opcional)"
    )


class ChatResponse(BaseModel):
    reply: str


def montar_conteudo(req: ChatRequest) -> list[dict]:
    """Converte o histórico + a nova mensagem para o formato esperado pelo Gemini."""
    contents: list[dict] = []
    for msg in req.history:
        papel = "user" if msg.role == "user" else "model"
        contents.append({"role": papel, "parts": [{"text": msg.content}]})
    contents.append({"role": "user", "parts": [{"text": req.message}]})
    return contents


@app.get("/api/health")
def health() -> dict:
    """Checagem rápida: diz se a chave da API está configurada."""
    return {"status": "ok", "model": GEMINI_MODEL, "api_key_configurada": bool(GEMINI_API_KEY)}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY não configurada. Crie o arquivo backend/.env "
            "a partir do .env.example e coloque sua chave.",
        )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": montar_conteudo(req),
    }

    # A API às vezes responde 503/429 quando está sobrecarregada.
    # Tentamos algumas vezes antes de desistir.
    tentativas = 3
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            for tentativa in range(1, tentativas + 1):
                resp = await client.post(
                    GEMINI_URL,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                )
                if resp.status_code not in (429, 503) or tentativa == tentativas:
                    break
                await asyncio.sleep(1.5 * tentativa)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao contatar a API de IA: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"A API de IA retornou erro {resp.status_code}: {resp.text}",
        )

    dados = resp.json()
    try:
        texto = dados["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        # Pode acontecer se a resposta for bloqueada por filtros de segurança.
        raise HTTPException(
            status_code=502,
            detail=f"Não foi possível extrair a resposta da IA. Retorno: {dados}",
        )

    return ChatResponse(reply=texto.strip())
