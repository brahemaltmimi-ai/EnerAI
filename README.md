# EnerAI

EnerAI is a web dashboard for energy data management, reporting, and performance tracking, backed by a Flask + SQLite service and an AI agent (via Ollama).

## Project Structure

```
EnerAI/
├── index.html              # Main dashboard entry point
├── css/
│   └── style.css           # Styling
├── js/
│   ├── api.js               # API request helpers
│   ├── config.js            # Global config (API base URL, state)
│   ├── init.js               # App initialization
│   ├── navigation.js         # Page navigation logic
│   ├── notifications.js      # Notification UI
│   ├── tailwindcdn.js         # Tailwind CDN setup
│   └── pages/                # Per-page scripts (home, reports, settings, etc.)
├── backend/
│   ├── app.py                     # Flask API + AI agent + SQLite integration
│   ├── DATASET.ipynb              # Dataset generation / seeding notebook
│   ├── energyw.db                 # SQLite database
│   └── Dockerfile                 # Backend container image
├── docker/
│   └── frontend/
│       ├── Dockerfile             # Frontend (Nginx) container image
│       └── nginx.conf             # Nginx config for the static dashboard
├── Logo/                    # Project branding assets
├── docker-compose.yml       # Orchestrates backend + frontend + Ollama
├── .dockerignore
├── .env.example              # Copy to .env to customize ports/model
├── test.drawio                # Architecture / flow diagram
└── requirements.txt            # Python dependencies
```

## Run with Docker (recommended)

The whole stack — frontend, backend, and Ollama (the local LLM used by the AI
agent) — is defined in `docker-compose.yml` and can be started with a single
command.

### Requirements

- [Docker](https://docs.docker.com/get-docker/) and the Docker Compose plugin
- ~5 GB free disk space for the `llama3.1` Ollama model (pulled automatically
  on first start)
- Optional: an NVIDIA GPU + the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
  for faster inference (see the commented `deploy.resources` block for the
  `ollama` service in `docker-compose.yml`)

### Start the stack

```bash
# optional: customize ports / model
cp .env.example .env

docker compose up -d --build
```

This starts three containers:

| Service    | Description                          | Default URL              |
|------------|---------------------------------------|---------------------------|
| `frontend` | Static dashboard served via Nginx     | http://localhost:8080     |
| `backend`  | Flask API + SQLite + AI agent         | http://localhost:8001     |
| `ollama`   | Local LLM runtime (model: `llama3.1`) | http://localhost:11434    |

On first start, the `ollama` container automatically pulls the `llama3.1`
model — this can take a while depending on your connection. Track progress
with:

```bash
docker compose logs -f ollama
```

Once it's ready, open **http://localhost:8080** in your browser.

### Useful commands

```bash
docker compose ps            # check status of all services
docker compose logs -f backend
docker compose down          # stop the stack
docker compose down -v       # stop and also remove the Ollama model volume
```

### Data persistence

`backend/energyw.db` is bind-mounted into the backend container, so any
reports created or updated through the app are written straight back to that
file on your host — no data is lost when the container restarts. The Ollama
models are stored in a named volume (`ollama_data`) so they aren't
re-downloaded on every restart.

### Configuration

Ports and the Ollama model can be changed via a `.env` file (see
`.env.example`):

| Variable         | Default     | Description                          |
|-------------------|-------------|---------------------------------------|
| `FRONTEND_PORT`    | `8080`      | Host port for the dashboard           |
| `BACKEND_PORT`      | `8001`      | Host port for the Flask API           |
| `OLLAMA_PORT`        | `11434`     | Host port for the Ollama server       |
| `OLLAMA_MODEL`        | `llama3.1`  | Model pulled and used by the AI agent |

The frontend's `API_BASE` (in `js/config.js`) points to
`http://127.0.0.1:8001`, matching the default `BACKEND_PORT`. If you change
`BACKEND_PORT`, update `API_BASE` accordingly and rebuild the frontend image.

## Run without Docker (manual setup)

1. Clone the repository:
   ```bash
   git clone https://github.com/brahemaltmimi-ai/EnerAI
   cd EnerAI
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate   # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Install and run [Ollama](https://ollama.com/) locally, then pull the model:
   ```bash
   ollama pull llama3.1
   ```

4. Run the backend:
   ```bash
   cd backend
   python app.py
   ```
   The Flask API defaults to `http://127.0.0.1:8001` (see `js/config.js`).

5. Open the frontend:
   - Open `index.html` directly in your browser, or serve it with a simple
     static server, e.g.:
     ```bash
     python -m http.server 5500
     ```
## Notes

- The API base URL used by the frontend is set in `js/config.js` (`API_BASE`).
- The SQLite database `backend/energyw.db` can be regenerated using `backend/DATASET.ipynb`.
- The backend reads its DB path from the `DB_PATH` environment variable
  (defaults to `energyw.db` locally, or `/app/data/energyw.db` inside Docker).
- The backend reads the Ollama server address from the `OLLAMA_HOST`
  environment variable (defaults to `http://127.0.0.1:11434` locally, or
  `http://ollama:11434` inside Docker).

## License

Add a license of your choice (e.g., MIT) if you plan to make this repository public.
