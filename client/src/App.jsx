import { useEffect, useState } from "react";


const CLOUD_NAME = "gent";         
const UPLOAD_PRESET = "unsigned_preset";      // your unsigned preset name

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return json.secure_url; // ✅ return the actual URL
}

export default function App() {
  const [status, setStatus] = useState("checking...");
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState(""); 
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // pasted URL
  const [file, setFile] = useState(null);       // uploaded file (optional)
  const [err, setErr] = useState("");

  // Health check
  useEffect(() => {
    fetch("/api/health")
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => setStatus(d.status ?? "unknown"))
      .catch(() => setStatus("error"));
  }, []);

  // Load messages
  useEffect(() => {
    fetch("/api/messages")
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  async function addMessage(e) {
    e.preventDefault();
    setErr("");

    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }

    if (!text.trim()) {
      setErr("Text is required.");
      return;
    }

    // Determine final image URL
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl && file) {
      try {
        finalImageUrl = await uploadToCloudinary(file);
      } catch {
        setErr("Image could not be uploaded.");
        return;
      }
    }

    try {
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), text: text.trim(), imageUrl: finalImageUrl }),
      });
      if (!r.ok) {
        let msg = `HTTP ${r.status}`;
        try { const j = await r.json(); if (j?.error) msg = j.error; } catch {}
        setErr(msg);
        return;
      }
      const saved = await r.json();
      setMessages(prev => [...prev, saved]);
      setTitle(""); // clear title input
      setText("");
      setImageUrl("");
      setFile(null);
    } catch {
      setErr("Network error. Is the server running?");
    }
  }

  async function removeMessage(id) {
    try {
      const r = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (r.ok || r.status === 204) {
        setMessages(prev => prev.filter(m => m._id !== id));
      }
    } catch {}
  }

  return (
    <main style={{ padding: 30, fontFamily: "Segoe UI, Arial", maxWidth: 820, margin: "0 auto" }}>
      <h1>The Cook Book</h1>
      <h3>Your personal recipe collection</h3>
      <p>
        This is a cooking application that lets you post all your cooking ideas and recipes; this way you’ll
        always have a place to keep them.
      </p>

      <section style={{ margin: "16px 0" }}>
        <strong>Recipe Catcher Status:</strong>{" "}
        <span style={{ color: status === "ok" ? "green" : "crimson" }}>{status}</span>
        {err && <div style={{ color: "crimson", marginTop: 6 }}>{err}</div>}
      </section>

      <section>
        <h2>Recipes:</h2>
        <ul></ul>
        <label>Title</label>
        <form onSubmit={addMessage} style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr auto", marginBottom: 16 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Type title"
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, gridColumn: "1 / 2" , gridRow: "1/2" }}
          />
          <br></br>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message"
            style={{ padding: 20, border: "1px solid #ccc", borderRadius: 6, gridColumn: "1 / 2" , gridRow: "2/3"  }}
          />
          <br></br>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL (https://...)"
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, gridColumn: "1 / 3" , gridRow: "3/3" }}
          />
          <button
            style={{ gridColumn: "2 / 4" , gridRow: "2/3" }}
            >
            Add</button>
        </form>

  

        {messages.length === 0 ? (
          <div style={{ color: "#666" }}>No messages yet.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {messages.map((m) => (
              <li
                key={m._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  marginBottom: 12,
                  background: "#fff",
                }}
              >
                {m.imageUrl ? (
                  <img
                    src={m.imageUrl}
                    alt={m.title || m.text || "Recipe"}
                    //alt={m.text || "Recipe"}
                    style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 8, background: "#f7f7f7" }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div style={{ width: 160, height: 120, background: "#f7f7f7", borderRadius: 8 }} />
                )}

                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {m.title || "Untitled"}</div>
                  <div>{m.text || "No description available."}</div>
                </div>

                <button onClick={() => removeMessage(m._id)} style={{ padding: "8px 12px", borderRadius: 6 }}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
