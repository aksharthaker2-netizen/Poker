# ♠️ Poker Game (Web) — Multiplayer Rooms with AI Bot Fill-In

A full-stack, real-time **Texas Hold'em** poker web application where players create or join **private game rooms** using a room code. Each room supports **2–10 players**. If a room doesn't have enough human players, **AI bots automatically (or optionally) fill the empty seats** — so a game can even be played entirely solo against bots.


---

## 🎮 Overview

| | |
|---|---|
| **Game Type** | Texas Hold'em (Room-based Multiplayer) |
| **Players per Room** | Min **2** — Max **10** |
| **Room Access** | Create a room → get a Room Code → others join with that code |
| **Empty Seats** | Automatically filled by AI bots (or manually selected by host) |
| **Solo Mode** | If no other players join, host can start with only bots |
| **Mode** | Real-time, WebSocket-driven gameplay |
| **Actions** | Fold / Call / Raise |
| **Bot Intelligence** | ML model served via a Python microservice |

Any player can **create a room** and receive a unique **Room Code** to share with friends. Others **join using that code**. Once ready, the host can **start the game** at any time — any unfilled seats are automatically taken by **AI bots**, with an **optional setting** to choose how many bots to add and their seat positions. If nobody else joins the room at all, the host can still start the game solo against bots.

---

## ✨ Features

- 🚪 **Create Room** — generates a unique, shareable room code
- 🔑 **Join Room** — join any active room using its code
- 👥 **2–10 players per room** (Texas Hold'em table)
- 🤖 **Auto Bot Fill-In** — empty seats are filled with AI bots when the host starts the game
- 🎚️ **Optional Bot Control** — host can choose number of bots / which seats to fill
- 🕹️ **Solo vs Bots** — start a game with only bots if no one else joins
- 🃏 Full Texas Hold'em rules engine (hand evaluation, turns, betting rounds)
- ⚡ Real-time gameplay via WebSockets
- 💰 Betting actions: Fold, Call, Raise
- 💵 Chip stack management per seat
- 🏆 Automatic hand evaluation & showdown logic
- 📜 Game history & hand logs per room
- 📱 Responsive UI (desktop & mobile)
- 🔄 Host controls: start game, kick player, add/remove bots, close room

---

## 🏗️ System Architecture

```
                         ┌────────────────────────────┐
                         │      SYSTEM ARCHITECTURE   │
                         └────────────────────────────┘

┌──────────────────┐   ┌─────────────────────┐   ┌────────────────┐   ┌─────────────────────┐
│   FRONTEND       │   │      BACKEND        │   │   DATABASE     │   │    ML SERVICE       │
│  (Developer)     │   │    (Developer)      │   │ (PostgreSQL)   │   │  (ML Part Handles)  │
├──────────────────┤   ├─────────────────────┤   ├────────────────┤   ├─────────────────────┤
│ React.js         │   │ Node.js + Express   │   │ PostgreSQL     │   │ Python (FastAPI)    │
│ (Vite + Tailwind)│   │ REST API            │   │ Tables:        │   │ ML Model (Poker Bot)│
│ Lobby / Room UI  │◄─►│ WebSocket Server    │◄─►│ • Users        │◄─►│ Decision Engine     │
│ Game Table UI    │   │ Room Manager        │   │ • Rooms        │   │ (Fold/Call/Raise)   │
│ State Management │   │ Seat Manager        │   │ • RoomSeats    │   │ Features (Hand      │
│ (Zustand/Redux)  │   │ Bot Manager         │   │ • Games        │   │ Strength, Pot Odds, │
│ Axios / Fetch    │   │ Game Engine         │   │ • GameStates   │   │ Position, etc.)     │
│ socket.io client │   │ Session Manager     │   │ • HandsHistory │   │ Multi-bot request   │
│                  │   │                     │   │ • Logs         │   │ handling            │
│                  │   │                     │   │ Redis (opt.)   │   │ Model Storage       │
│                  │   │                     │   │ Caching        │   │ (Pickle / Joblib)   │
└──────────────────┘   └─────────────────────┘   └────────────────┘   └─────────────────────┘
```

### Component Breakdown

**Frontend (Developer)**
- **React.js** (Vite + Tailwind CSS) — UI framework & styling
- **Lobby / Room UI** — create room, enter room code to join, room settings (max players, bot options)
- **Game Table UI** — poker table supporting up to 10 seats, cards, chip stacks, action buttons
- **State Management** — Zustand / Redux for room + game state
- **API Communication** — Axios / Fetch for REST calls
- **WebSocket Client** — `socket.io-client` for real-time room & game sync

**Backend (Developer)**
- **Node.js + Express.js** — application server
- **REST API** — room creation/join, auth, leaderboard endpoints
- **WebSocket Server** — real-time room & game state sync
- **Room Manager** — creates rooms, generates room codes, tracks room lifecycle (waiting → in-progress → ended)
- **Seat Manager** — assigns players/bots to seats (2–10 seats per room), tracks empty seats
- **Bot Manager** — decides how many bots are needed to fill a room, requests bot decisions from the ML Service, supports host-selected bot count
- **Game Engine** — rules enforcement, hand evaluation, turn management
- **Session Manager** — active connections, reconnect handling, host transfer if host leaves

**Database — PostgreSQL**
- **PostgreSQL** — primary relational database
- **Tables:** `users`, `rooms`, `room_seats`, `games`, `game_states`, `hands_history`, `logs`
- **Redis ** — caching & fast in-memory state (e.g., active room state, room code lookups)

**ML Service (ML Part)**
- **Python (FastAPI)** — microservice exposing the bot's decision endpoint
- **ML Model** — trained poker-decision model
- **Decision Engine** — outputs Fold / Call / Raise (can be queried for multiple bots per room in parallel)
- **Feature Engineering** — hand strength, pot odds, position, stack depth, number of active players
- **Model Storage** — serialized via Pickle / Joblib

The Backend and ML Service communicate over a simple request/response contract:
`Bot Action Request (per bot seat) → Decision Engine → Action Response`.

---

## 🔄 Room & Game Flow

```
Create Room → Share Room Code → Players Join (2–10) → Host Starts Game
                                              │
                                              ▼
                          Empty seats auto-filled with Bots (or host-selected count)
                                              │
                                              ▼
              Cards Dealt → Player/Bot Actions (turn order) → Bot Decision (ML Service, as needed)
                                              │
                                              ▼
                          Update Game State → Next Turn / Showdown → Next Hand or End Game
```

**Room Lifecycle**
1. **Waiting Room** — host creates a room, sets max players (2–10) and bot preference; others join via room code
2. **Start Game** — host triggers start at any time (even solo)
   - If seats are empty and auto-fill is on → bots fill remaining seats automatically
   - If host chooses manual mode → host picks how many bots to add before starting
   - If **no other players join at all** → host can start a game made up entirely of bots
3. **In Progress** — hands are played in real time; human actions come from the UI, bot actions come from the ML Service
4. **Room End** — host closes the room, or all human players leave

All real-time events (room updates, seat changes, deals, bets, turn changes, showdown results) are synced between clients and server via **WebSockets**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, Zustand/Redux, Axios, Socket.io-client |
| Backend | Node.js, Express.js, Socket.io (WebSocket server) |
| Database | **PostgreSQL**, Redis (caching) |
| ML Service | Python, FastAPI, scikit-learn / custom model, Pickle / Joblib |
| Deployment | Vercel/Netlify (Frontend), Render/Railway (Backend & ML Service), Railway/Aiven (PostgreSQL) |

---

## 📂 Project Structure

```
Poker/
├── frontend/                      # React.js client
│   ├── src/
│   │   ├── components/
│   │   │   ├── lobby/              # Create room / Join room forms
│   │   │   ├── room/                # Waiting room, seat list, bot settings, room code display
│   │   │   ├── table/               # Poker table (2–10 seats), cards, chips, action buttons
│   │   │   └── shared/
│   │   ├── store/                   # Zustand/Redux: room state, game state
│   │   ├── services/                # Axios/API + socket.io client setup
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Create/Join room entry point
│   │   │   ├── Room.jsx             # Waiting room view
│   │   │   └── Game.jsx             # Active game table view
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                       # Node.js + Express server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── rooms.js             # Create/join/list rooms (REST)
│   │   │   ├── auth.js
│   │   │   └── game.js
│   │   ├── sockets/
│   │   │   ├── roomEvents.js        # join/leave/seat updates
│   │   │   └── gameEvents.js        # deal/action/turn/showdown
│   │   ├── room-manager/            # Room creation, room code generation, lifecycle
│   │   ├── seat-manager/            # Seat assignment (players + bots), 2–10 seat handling
│   │   ├── bot-manager/             # Determines bot count, requests decisions from ML service
│   │   ├── game-engine/             # Poker rules, hand evaluation, turn logic
│   │   ├── session-manager/         # Connections, reconnects, host transfer
│   │   ├── models/                  # PostgreSQL models / schemas
│   │   ├── config/                  # DB config, env setup
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── ml-service/                     # Python FastAPI microservice
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint
│   │   ├── decision_engine.py       # Fold/Call/Raise logic (supports multiple bots/room)
│   │   ├── features.py              # Hand strength, pot odds, position, active players
│   │   ├── model/                   # Trained model (pickle/joblib)
│   │   └── schemas.py
│   ├── requirements.txt
│   └── .env.example
│
├── database/                       # PostgreSQL schema & migrations
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql                   # users, rooms, room_seats, games, game_states, hands_history, logs
│
├── docs/                           # Architecture diagrams & documentation
│
├── docker-compose.yml               # Local orchestration (optional)
├── .gitignore
└── README.md
```

> ⚠️ Adjust this structure to match your actual repo layout if it differs.

### 🧩 New/Changed Modules vs. the Original 2-Player Design
| Module | Purpose |
|---|---|
| `room-manager/` | Creates rooms, generates unique room codes, manages room state (waiting/active/ended) |
| `seat-manager/` | Tracks 2–10 seats per room, assigns human players and bots to seats |
| `bot-manager/` | Decides how many bots to add (auto or host-selected), triggers ML Service calls for each bot seat |
| `lobby/`, `room/` (frontend) | UI for creating/joining rooms and the pre-game waiting room |
| `rooms` / `room_seats` (DB tables) | New tables to persist room and seat state |

---

## 🧮 Database Schema (Key Tables)

| Table | Description |
|---|---|
| `users` | Player accounts (optional if guest play is supported) |
| `rooms` | Room code, host, max players, status, bot settings |
| `room_seats` | Seat number, occupant type (`human` / `bot`), player/bot reference, chip stack |
| `games` | A single game instance tied to a room |
| `game_states` | Current hand state — pot, community cards, turn, betting round |
| `hands_history` | Completed hands, winners, showdown results |
| `logs` | Action logs (fold/call/raise) per hand |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (v14+)
- Redis (optional, for caching)
- npm / yarn / pnpm

### 1. Clone the repository
```bash
git clone https://github.com/aksharthaker2-netizen/Poker.git
cd Poker
```

### 2. Set up the Database (PostgreSQL)
```bash
# Create the database
createdb poker_game

# Run schema/migrations
psql -d poker_game -f database/schema.sql
```

Update your `.env` with PostgreSQL credentials:
```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/poker_game
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # configure DATABASE_URL, PORT, JWT_SECRET, ML_SERVICE_URL
npm run dev
```

### 4. ML Service Setup
```bash
cd ml-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 6. Open the app
Visit `http://localhost:5173` (or your configured Vite port), create a room, share the room code, and play.

---

## 🔐 Environment Variables

**Backend (`backend/.env`)**
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/poker_game
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:8000
MIN_PLAYERS=2
MAX_PLAYERS=10
AUTO_FILL_BOTS=true
```

**ML Service (`ml-service/.env`)**
```env
MODEL_PATH=./app/model/poker_bot_model.pkl
PORT=8000
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## 👥 Responsibilities

### Developer (Frontend + Backend)
- Build responsive UI using React.js + Tailwind (lobby, room, table)
- Implement room creation/joining, seat assignment UI, and game UI
- Develop REST APIs for rooms, game, auth, leaderboard, etc.
- Implement WebSocket for real-time room & game updates
- Build the room/seat/bot managers and the game engine (rules, hand evaluation, turn logic)
- Manage PostgreSQL schema and connections
- Deploy and maintain the application

### ML Part (Bot Intelligence)
- Collect poker game data / simulate games
- Engineer features (hand strength, pot odds, position, active players, etc.)
- Train ML model (classification / reinforcement learning)
- Build the FastAPI service for bot decision-making, supporting concurrent requests for multiple bot seats
- Integrate the model with the backend via API
- Continuously improve bot performance

---

## 🚀 Deployment

| Component | Suggested Platform |
|---|---|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway |
| ML Service | Render / Railway |
| Database (PostgreSQL) | Railway / Aiven / Supabase |

```
Frontend → Backend → ML Service → Database
```

---

## 🗺️ Roadmap Ideas
- [ ] Spectator mode
- [ ] User authentication & profiles
- [ ] Leaderboard / stats tracking
- [ ] Multiple ML bot difficulty levels (easy/medium/hard)
- [ ] Private vs public room listing
- [ ] Tournament mode (multi-table)
- [ ] Hand history replay viewer
- [ ] Rebuy / re-add chips option

---

## 📄 License
MIT LICENSE

---

## 🙌 Acknowledgements
Built as a full-stack learning project combining real-time multiplayer web development with applied machine learning for game AI.
