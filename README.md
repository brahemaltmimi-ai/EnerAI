# EnerAI

EnerAI is a web dashboard for energy data management, reporting, and performance tracking, backed by a Flask + SQLite service and an AI agent (via Ollama).

## Project Structure

```
EnerAI/
├── index.html          # Main dashboard entry point
├── css/
│   └── style.css       # Styling
├── js/
│   ├── api.js           # API request helpers
│   ├── config.js        # Global config (API base URL, state)
│   ├── init.js           # App initialization
│   ├── navigation.js     # Page navigation logic
│   ├── notifications.js  # Notification UI
│   ├── tailwindcdn.js     # Tailwind CDN setup
│   └── pages/            # Per-page scripts (home, reports, settings, etc.)
├── backend/
│   ├── CodeAIagent_SLQ_DB.ipynb  # Flask API + AI agent + SQLite integration
│   ├── DATASET.ipynb              # Dataset generation / seeding notebook
│   └── energyw.db                 # SQLite database
├── Logo/                # Project branding assets
├── test.drawio          # Architecture / flow diagram
└── requirements.txt      # Python dependencies
```

## Requirements

- Python 3.10+
- [Ollama](https://ollama.com/) installed and running locally (used by the AI agent)

## Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd EnerAI
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate   # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run the backend:
   - Open `backend/CodeAIagent_SLQ_DB.ipynb` in Jupyter and run all cells,
     or convert it to a script and run with `python`/`flask run`.
   - The Flask API defaults to `http://127.0.0.1:8001` (see `js/config.js`).

4. Open the frontend:
   - Open `index.html` directly in your browser, or serve it with a simple
     static server, e.g.:
     ```bash
     python -m http.server 5500
     ```
## Demo Video

[![Demo Video](https://raw.githubusercontent.com/brahemaltmimi-ai/EnerAI/main/EnerAI.mp4)

## Notes

- The API base URL used by the frontend is set in `js/config.js` (`API_BASE`).
- The SQLite database `backend/energyw.db` can be regenerated using `backend/DATASET.ipynb`.

## License

Add a license of your choice (e.g., MIT) if you plan to make this repository public.
