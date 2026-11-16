const $ = (id) => document.getElementById(id);
const msgBox = $("messages"), formEl = $("form"), inputEl = $("input"), sendBtn = $("send");
const chatHistory = [];   // sent to the backend so the bot remembers the conversation
let busy = false;

/* ---------- Dark mode ---------- */
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("theme").textContent = theme === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem("theme", theme); } catch (e) { }
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) { }
setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("theme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

/* ---------- Safe Markdown: escape HTML first, then allow only <b> <i> <ul> <li> <p> ---------- */
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");

function renderMarkdown(text) {
  let html = "", inList = false;
  for (const line of escapeHtml(text).split("\n")) {
    const item = line.match(/^\s*[-*]\s+(.*)/);
    if (item && !inList) { html += "<ul>"; inList = true; }
    if (!item && inList) { html += "</ul>"; inList = false; }
    if (item) html += `<li>${inline(item[1])}</li>`;
    else if (line.trim()) html += `<p>${inline(line)}</p>`;
  }
  return html + (inList ? "</ul>" : "");
}

/* ---------- Chat UI ---------- */
function addMessage(role, text = "") {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  if (role === "user") el.textContent = text;          // user text is never inserted as HTML
  else el.innerHTML = renderMarkdown(text);
  msgBox.appendChild(el);
  msgBox.scrollTop = msgBox.scrollHeight;              // auto-scroll
  return el;
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "msg bot typing";
  el.innerHTML = "<span></span><span></span><span></span>";
  msgBox.appendChild(el);
  msgBox.scrollTop = msgBox.scrollHeight;
  return el;
}

async function sendMessage(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true; sendBtn.disabled = true; inputEl.value = "";
  addMessage("user", text);
  const typing = showTyping();
  let reply = "", bubble = null;
  const show = () => {
    if (!bubble) { typing.remove(); bubble = addMessage("bot"); }
    bubble.innerHTML = renderMarkdown(reply);
    msgBox.scrollTop = msgBox.scrollHeight;
  };
  try {
    const res = await fetch("/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-10) }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const reader = res.body.getReader();               // read the stream piece by piece
    const decoder = new TextDecoder();
    let buffer = "";
    for (; ;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop();                           // keep the incomplete tail
      for (const ev of events) {
        const data = ev.replace(/^data: /, "");
        if (data && data !== "[DONE]") { reply += JSON.parse(data).text; show(); }
      }
    }
  } catch (err) {
    console.error(err);
    reply = reply || "Sorry, I can't reach the server right now. Please try again.";
    show();
  }
  typing.remove();
  chatHistory.push({ role: "user", text }, { role: "bot", text: reply });
  busy = false; sendBtn.disabled = false; inputEl.focus();
}

formEl.onsubmit = (e) => { e.preventDefault(); sendMessage(inputEl.value); };
document.querySelectorAll("#quick button").forEach((b) => (b.onclick = () => sendMessage(b.dataset.msg)));
addMessage("bot", "Assalam o Alaikum! ☕ I'm **Chai Buddy**. Ask me about our menu, timings or location.");
