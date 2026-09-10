# Nexus IA — Chatbot com Inteligência Artificial

Aplicação web que recebe perguntas do usuário e gera respostas usando IA
(Google Gemini) por meio de uma API. Interface moderna com efeito *glass*,
fundo animado, bolhas com gradiente, indicador de "digitando" e textarea
que cresce com o texto (Enter envia, Shift+Enter quebra linha).

- **Frontend:** React (Vite)
- **Backend:** Python + FastAPI
- **IA:** API do Google Gemini
- **Comunicação:** API REST com JSON

```
Usuário → React → (POST /api/chat) → FastAPI → API Gemini → resposta → React
```

## Pré-requisitos

- Python 3.10+ ([python.org](https://www.python.org/downloads/))
- Node.js 18+ ([nodejs.org](https://nodejs.org/))
- Uma chave da API do Gemini: https://aistudio.google.com/apikey

## Configuração

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/Mac:
# source .venv/bin/activate
pip install -r requirements.txt
```

Crie o arquivo `backend/.env` (copie de `.env.example`) e coloque sua chave:

```
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-flash-latest
```

Rode o backend:

```bash
uvicorn main:app --reload
```

Backend disponível em http://localhost:8000
(documentação automática em http://localhost:8000/docs)

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente http://localhost:5173).

## Como usar

1. Digite uma mensagem no campo de texto.
2. Clique em **Enviar** (ou pressione Enter).
3. A resposta gerada pela IA aparece na conversa.

## Estrutura

```
ChatBot/
├── backend/
│   ├── main.py            # API FastAPI (endpoint /api/chat)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env               # sua chave (não versionar)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # interface do chat
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Endpoints do backend

| Método | Rota          | Descrição                                        |
|--------|---------------|--------------------------------------------------|
| GET    | `/api/health` | Verifica se a chave da API está configurada      |
| POST   | `/api/chat`   | Recebe `{ message, history }` e devolve `{ reply }` |

Exemplo de requisição:

```json
POST /api/chat
{
  "message": "Qual a capital da França?",
  "history": []
}
```

Resposta:

```json
{ "reply": "A capital da França é Paris." }
```
