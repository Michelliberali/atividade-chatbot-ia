import { useState, useRef, useEffect, useCallback } from "react";

// Endereço do backend FastAPI.
const API_URL = "http://localhost:8000/api/chat";

const SAUDACAO = "Olá! Sou seu assistente com Inteligência Artificial. Pergunte o que quiser 👇";

function Avatar({ tipo }) {
  if (tipo === "user") {
    return (
      <div className="avatar avatar-user" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" fill="currentColor" />
        </svg>
      </div>
    );
  }
  return (
    <div className="avatar avatar-ia" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <rect x="4" y="7" width="16" height="12" rx="4" fill="currentColor" />
        <circle cx="9.5" cy="13" r="1.6" fill="#0b1020" />
        <circle cx="14.5" cy="13" r="1.6" fill="#0b1020" />
        <path d="M12 3v3M8 3.5l1 2.5M16 3.5l-1 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function App() {
  const [mensagens, setMensagens] = useState([{ role: "assistant", content: SAUDACAO }]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const fimDaLista = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  // Textarea que cresce conforme o texto.
  const ajustarAltura = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const cheio = el.scrollHeight;
    el.style.height = Math.min(cheio, 140) + "px";
    el.style.overflowY = cheio > 140 ? "auto" : "hidden";
  }, []);

  useEffect(ajustarAltura, [texto, ajustarAltura]);

  async function enviar(e) {
    e?.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || carregando) return;

    setErro("");
    setTexto("");

    const historico = mensagens.slice(1);
    setMensagens((m) => [...m, { role: "user", content: pergunta }]);
    setCarregando(true);

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: pergunta, history: historico }),
      });
      const dados = await resp.json();
      if (!resp.ok) throw new Error(dados.detail || `Erro ${resp.status}`);
      setMensagens((m) => [...m, { role: "assistant", content: dados.reply }]);
    } catch (err) {
      setErro(err.message || "Não foi possível obter a resposta.");
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  }

  function aoTeclar(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  function limpar() {
    setMensagens([{ role: "assistant", content: SAUDACAO }]);
    setErro("");
    inputRef.current?.focus();
  }

  return (
    <div className="tela">
      <div className="aurora" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <div className="janela">
        <header className="topo">
          <div className="marca">
            <span className="logo">✦</span>
            <div>
              <h1>Nexus IA</h1>
              <p className="status">
                <span className="ponto" /> online · Gemini
              </p>
            </div>
          </div>
          <button className="btn-limpar" onClick={limpar} title="Nova conversa">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
            </svg>
          </button>
        </header>

        <main className="conversa">
          {mensagens.map((msg, i) => (
            <div key={i} className={`linha ${msg.role}`} style={{ "--i": i }}>
              <Avatar tipo={msg.role} />
              <div className="balao">{msg.content}</div>
            </div>
          ))}

          {carregando && (
            <div className="linha assistant">
              <Avatar tipo="assistant" />
              <div className="balao balao-digitando">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          {erro && <div className="erro">⚠️ {erro}</div>}
          <div ref={fimDaLista} />
        </main>

        <form className="barra" onSubmit={enviar}>
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Escreva uma mensagem…"
            rows={1}
            autoFocus
          />
          <button type="submit" className="enviar" disabled={carregando || !texto.trim()} aria-label="Enviar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l16-8-6 16-2-6-8-2z" />
            </svg>
          </button>
        </form>
      </div>

      <footer className="rodape">React · FastAPI · Google Gemini</footer>
    </div>
  );
}
