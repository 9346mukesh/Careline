# Careline — Voice Doctor Appointment Assistant

A full-stack clinic front desk for booking and cancelling doctor appointments by
voice. Patients talk to an AI receptionist in the browser; staff can also manage
the same schedule from a React dashboard.

The voice agent runs on a **Pipecat** pipeline over **SmallWebRTC**, with
**Groq** for reasoning and **ElevenLabs** for speech-to-text and text-to-speech.
Doctors, slots, and appointments are served by **FastAPI** and stored in a local
JSON ledger.

## What it does

- Start and end a live browser voice call with the AI receptionist.
- See connection state, agent activity, and a live transcript.
- Browse doctors, specialities, and open slots synced with the API.
- Book an appointment from the dashboard or let the voice agent do it.
- Cancel an appointment with phone-number verification.
- View the appointment ledger with status filters and masked phone numbers.
- Refresh availability automatically after calls and every 15 seconds.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite, plain CSS |
| Voice client | `@pipecat-ai/client-js`, `@pipecat-ai/small-webrtc-transport` |
| Backend | FastAPI, Uvicorn, Pydantic |
| Voice pipeline | Pipecat AI |
| LLM | **Groq — `openai/gpt-oss-120b`** |
| Speech-to-text | ElevenLabs `scribe_v2_realtime` |
| Text-to-speech | ElevenLabs `eleven_flash_v2_5` |
| Storage | JSON files in `backend/data/` |

### Which LLM is used?

The assistant uses **`openai/gpt-oss-120b`**, served through **Groq** with
Pipecat's `GroqLLMService`. It is configured in `backend/.env`:

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
```

If `GROQ_MODEL` is omitted, the code falls back to
`llama-3.3-70b-versatile`. The model is given three tools:

1. `check_doctor_availability` — find doctors and open slots.
2. `book_appointment` — reserve a slot after phone confirmation.
3. `cancel_appointment` — cancel after phone confirmation.

The system prompt in `backend/app/voice/prompts.py` requires the agent to read
the phone number back, get explicit confirmation, and never invent availability
or claim success before a tool confirms it.

## Requirements

- Python **3.11**
- Node.js **20.19+** (tested with Node 24)
- A [Groq API key](https://console.groq.com/)
- An [ElevenLabs API key](https://elevenlabs.io/) and a voice ID
- A modern browser with microphone access (Chrome/Edge/Safari)

## Run the project

Use two terminals: one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure credentials
cp .env.example .env
# edit .env and fill in GROQ_API_KEY, ELEVENLABS_API_KEY,
# ELEVENLABS_VOICE_ID, and the model names

# Start the API
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is now at <http://127.0.0.1:8000>. Useful endpoints:

- <http://127.0.0.1:8000/health>
- <http://127.0.0.1:8000/docs> — interactive OpenAPI docs
- <http://127.0.0.1:8000/api/voice/status> — voice readiness check

`/api/voice/status` reports whether the LLM and speech credentials are present
without exposing the keys. The voice offer endpoint returns `503` until both
providers are configured.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open <http://127.0.0.1:5173>.

The frontend calls `http://localhost:8000` by default. To point it elsewhere,
create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Restart the dev server after changing it.

### 3. Try a voice call

1. Open the **Voice assistant** page (or use **Start a call** in the top bar).
2. Allow microphone access when prompted.
3. Wait for the agent's opening greeting.
4. Try: *“Find a cardiologist tomorrow.”* → choose a slot → provide a name and
   phone number → confirm → ask to book.
5. Watch the transcript and tool activity, then check **Appointments**.

Microphone access requires `localhost`/`127.0.0.1` or HTTPS. If the browser
blocks the microphone, the app shows a permission error instead of retrying
silently.

## Configuration

Backend variables (`backend/.env`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Voice Doctor Assistant` | API title |
| `APP_ENV` | `development` | Environment label |
| `GROQ_API_KEY` | — | Required for the voice agent |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model; project `.env` uses `openai/gpt-oss-120b` |
| `ELEVENLABS_API_KEY` | — | Required for STT/TTS |
| `ELEVENLABS_VOICE_ID` | — | Required; voice used by the agent |
| `ELEVENLABS_STT_MODEL` | `scribe_v2_realtime` | Speech-to-text model |
| `ELEVENLABS_TTS_MODEL` | `eleven_flash_v2_5` | Text-to-speech model |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |

Frontend variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI base URL |

Secrets stay on the backend. The browser only receives a readiness flag from
`/api/voice/status`; it never sees API keys.

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health and storage check |
| `GET` | `/api/doctors` | List doctors with slots |
| `GET` | `/api/doctors/{doctor_id}` | One doctor |
| `GET` | `/api/availability` | Filter by `doctor_id`, `date`, `speciality` |
| `GET` | `/api/appointments` | List appointments; optional `phone`, `status` |
| `POST` | `/api/appointments` | Book a slot |
| `POST` | `/api/appointments/{id}/cancel` | Cancel with phone verification |
| `GET` | `/api/voice/status` | Voice provider readiness |
| `POST` | `/api/voice/offer` | WebRTC SDP offer |
| `PATCH` | `/api/voice/offer` | WebRTC ICE candidates |

Example booking:

```bash
curl -X POST http://127.0.0.1:8000/api/appointments \
  -H 'Content-Type: application/json' \
  -d '{
    "doctor_id": "DOC001",
    "slot_id": "SLOT002",
    "patient_name": "Asha Menon",
    "patient_phone": "9876543210",
    "phone_confirmed": true
  }'
```

## How the voice call works

1. The React client lazy-loads the Pipecat SDK and creates a `SmallWebRTCTransport`.
2. It posts an SDP offer to `/api/voice/offer`.
3. FastAPI asks Pipecat to open a `SmallWebRTCTransport` connection and starts a
   per-call pipeline:

   ```text
   browser audio → ElevenLabs STT → LLM context → Groq LLM
                 → ElevenLabs TTS → browser audio
   ```

4. On the RTVI `client_ready` event the agent speaks a short greeting.
5. Tool names are reported to the dashboard for activity indicators; arguments
   and results are never sent to the browser.
6. The dashboard refreshes doctors and appointments after the call ends.

## Project structure

```text
voice-doctor-assistant/
├── backend/
│   ├── app/
│   │   ├── api/routes.py              # REST + WebRTC endpoints
│   │   ├── core/config.py             # env settings + readiness
│   │   ├── models/appointment.py      # Pydantic request models
│   │   ├── services/                  # booking logic + JSON storage
│   │   ├── voice/
│   │   │   ├── agent.py               # Groq LLM + tools
│   │   │   ├── pipeline.py            # Pipecat voice pipeline
│   │   │   ├── prompts.py             # system prompt
│   │   │   └── tools.py               # tool implementations
│   │   └── main.py                    # FastAPI app + security headers
│   ├── data/
│   │   ├── doctors.json               # doctors and slots
│   │   └── appointments.json          # appointment ledger
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js              # fetch wrapper and API methods
    │   ├── components/                # shell, cards, tables, dialogs
    │   ├── context/                   # clinic data, voice, toasts
    │   ├── pages/                     # overview, doctors, appointments, voice
    │   └── utils/format.js            # dates, times, phones
    └── package.json
```

## Data and demo state

All bookings are persisted to `backend/data/appointments.json`. Slots live in
`backend/data/doctors.json`. Both files are read on each request, so editing
them while the server is running is safe.

The seeded slots use fixed dates. If they are in the past, update the dates in
`backend/data/doctors.json` so the dashboard and agent have upcoming times.

To reset the ledger:

```bash
printf '{\n    "appointments": []\n}\n' > backend/data/appointments.json
```

There is no database or migration step.
