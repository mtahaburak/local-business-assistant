# Chai Ghar Café – Local Business Assistant

A branded chat widget for an imaginary café. The bot (**Chai Buddy**) answers only from `backend/business.json`, streams its reply word by word and politely refuses off-topic questions.

**Stack:** HTML + CSS + vanilla JS · FastAPI · Groq API (`groq`)

## Features
- Chat window, user/bot bubbles, typing indicator, auto-scroll, phone-friendly layout
- Branding: name + logo, colour theme in CSS variables, dark mode toggle
- `POST /chat/stream` returns a `StreamingResponse` (`text/event-stream`); the JS reads it with `fetch` + `ReadableStream`
- Grounding: `business.json` is loaded at startup and inserted into the system prompt
- Persona (name + tone) and guardrails (one-sentence refusals) live in the system prompt
- Bonus: safe Markdown rendering (HTML escaped first) and quick-reply buttons

## Run locally
1. Get a free API key at https://console.groq.com/keys
2. In the project folder:
   ```bash
   python -m venv .venv
   source .venv/bin/activate        # Windows: .venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```
3. Open the `.env` file (already in the folder) and paste your key after `GROQ_API_KEY=`
4. Start the server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
5. Open http://127.0.0.1:8000

## Make it your own
- Business details: `backend/business.json`
- Bot name, tone and rules: `BOT_NAME`, `TONE`, `SYSTEM_PROMPT` in `backend/main.py`
- Colours: CSS variables at the top of `frontend/style.css`
- "Model not found" error? Change `GROQ_MODEL` in `.env` (names: https://console.groq.com/docs/models)

## Upload to GitHub
```bash
git init
git add .
git status        # check that .env is NOT listed
git commit -m "Local business assistant"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Never commit `.env` – it holds your API key.

### Uploading with the GitHub website instead
New repository → **uploading an existing file** → drag in everything **except `.env`**. The website ignores `.gitignore`, so it would publish your key.
