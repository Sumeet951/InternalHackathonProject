import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ImagePlus, Send, Sparkles, Trash2, X } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

function App() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage({ name: file.name, url: reader.result });
    reader.readAsDataURL(file);
    setError("");
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: messages, image: image?.url || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The assistant could not respond.");
      setMessages([...nextMessages, { role: "assistant", content: data.response }]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <main className="shell">
    <aside className="context-panel">
      <div className="brand"><span className="brand-mark"><Sparkles size={18} /></span><span>Lens / 01</span></div>
      <div className="eyebrow">Visual intelligence</div>
      <h1>Ask better questions of what you see.</h1>
      <p className="intro">Bring one image into focus, then explore it with a thoughtful visual assistant.</p>
      <button className="upload-zone" onClick={() => fileInput.current?.click()}>
        {image ? <img src={image.url} alt="Selected preview" /> : <><ImagePlus size={28} /><span>Drop an image here<br /><small>JPG or PNG · one image</small></span></>}
      </button>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png" onChange={chooseImage} hidden />
      {image && <button className="remove-image" onClick={() => setImage(null)}><X size={14} /> Remove {image.name}</button>}
      <div className="sidebar-footer"><span className="status-dot" /> Groq vision model <span>·</span> Ready</div>
    </aside>
    <section className="chat-panel">
      <header className="chat-header"><div><div className="eyebrow">Conversation</div><h2>Image chat</h2></div><button className="icon-button" title="Clear conversation" onClick={() => setMessages([])}><Trash2 size={17} /></button></header>
      <div className="messages">
        {messages.length === 0 && <div className="empty-state"><div className="empty-icon"><Sparkles size={22} /></div><h3>What should we look at?</h3><p>Upload an image and ask anything about its details, mood, objects, or story.</p></div>}
        {messages.map((item, index) => <div className={`message ${item.role}`} key={`${item.role}-${index}`}><span className="message-label">{item.role === "user" ? "You" : "Lens"}</span><p>{item.content}</p></div>)}
        {busy && <div className="message assistant"><span className="message-label">Lens</span><p className="typing"><i /><i /><i /></p></div>}
      </div>
      <div className="composer-wrap">
        {error && <div className="error">{error}</div>}
        <form className="composer" onSubmit={sendMessage}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your image..." rows="1" disabled={busy} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} /><button className="send-button" title="Send message" disabled={!draft.trim() || busy}><Send size={17} /></button></form>
        <div className="composer-note">Enter to send <span>·</span> Shift + Enter for a new line</div>
      </div>
    </section>
  </main>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
