# NEXUS: AI Virtual Society

A Next.js dashboard for an autonomous virtual society of 10 Gemini-powered agents living in Nexus City, with persistent SQLite memory and session history backed by Prisma ORM.

The simulation records agent decisions, credit transactions, personal needs, relationships, memories, and city-wide events directly into a local SQLite database (`prisma/dev.db`).

---

## Features

- **Persistent Memory & State**: Agent memories, actions, decisions, credits, locations, and events are stored in SQLite using Prisma.
- **Server Restart Resilience**: If the development server restarts or crashes, the latest simulation state and agent histories are automatically restored.
- **Session Management**: Create, inspect, switch between, and manage multiple simulation runs.
- **Gemini Flash Console**: Test standalone Gemini model prompts directly on localhost (`/api/generate`) alongside the autonomous multi-agent simulation.
- **Full Ledger**: Atomically records agent actions, trade/help transfers, conversations, and survival events.

---

## Database Architecture (Prisma & SQLite)

The schema defines five relational models:

1. **`SimulationSession`**: Tracks session title, status (`idle`, `running`, `completed`, `error`), simulated hour (0–24), day, round (0–10), and timestamps.
2. **`Agent`**: Stores name, personality, occupation/role, goals, credits, hunger, energy, happiness, alive status, location, and coordinates.
3. **`AgentMemory`**: Logs personal agent recollections across hours and rounds.
4. **`SimulationEvent`**: Stores system events, agent decisions, meals, work, and trades.
5. **`AgentAction`**: Records granular decision ledger with actor, action type, target agent, credit deltas, and reasons.

---

## Requirements

- Node.js 20.9+
- A Google Gemini API key from Google AI Studio

---

## Environment Setup

Copy `.env.example` to `.env.local` and `.env`:

```bash
npm install
```

Configure your `.env.local` (and `.env` for Prisma CLI):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL="file:./dev.db"
```

> **Security Note:** Never prefix `GEMINI_API_KEY` with `NEXT_PUBLIC_` and never commit `.env.local` or `.env` to version control. All model calls are executed server-side.

---

## Database Setup & Migrations

To initialize or update the SQLite database schema:

```bash
# Push schema changes to dev.db and generate Prisma Client
npx prisma db push

# (Optional) Open Prisma Studio to browse your SQLite tables visually
npx prisma studio
```

---

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Run Standalone Prompt**: Click **Run on Localhost** in the Gemini Flash Console to verify model connectivity.
- **Start Simulation**: Click **Start simulation** to begin autonomous agent execution across 10 rounds (24 simulated hours).
- **Manage Sessions**: Click **Sessions** in the top navigation to switch sessions or create a new experiment.

---

## How to Test Persistence Across Server Restarts

1. Open [http://localhost:3000](http://localhost:3000) and click **Start simulation**.
2. Allow 1–3 rounds to execute (watch agents move, earn credits, and populate memories).
3. Stop the development server in your terminal:
   - Press `Ctrl + C`
4. Start the server again:
   ```bash
   npm run dev
   ```
5. Refresh [http://localhost:3000](http://localhost:3000).
6. **Notice**: The simulated hour, round number, agent credit balances, needs, and previous memory logs are completely preserved and restored from `dev.db`!

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/simulation` | Hydrates and returns active simulation state from SQLite |
| `POST` | `/api/simulation` | Controls simulation (`action: "start" \| "reset" \| "load" \| "save"`) |
| `GET` | `/api/sessions` | Lists all simulation sessions and summary metrics |
| `POST` | `/api/sessions` | Creates a fresh simulation session with 10 seeded citizens |
| `GET` | `/api/sessions/[id]` | Inspects full details of a specific session (agents, memories, events) |
| `POST` | `/api/sessions/[id]/load` | Switches active simulation to session `[id]` |
| `DELETE` | `/api/sessions/[id]` | Deletes session and cascades child records from SQLite |
| `POST` | `/api/generate` | Executes direct Gemini prompt requests on localhost |
