# OpenCog Cognitive Synergy Visualizer

An interactive prototype dashboard visualizing the core architecture of an OpenCog-inspired cognitive system, showcasing **Cognitive Synergy** across three subsystems:

## Subsystems

### 🧠 AtomSpace
Live-rendering force-directed graph of conceptual memory. Nodes (Atoms) visually change:
- **Size** based on Attention Values (ECAN short-term importance)
- **Color gradient** based on Truth Values (PLN certainty: red → cyan)
- **Glow intensity** proportional to attention

### 🔗 Probabilistic Logic Networks (PLN)
Scrolling console tracking logical rule evaluations:
- **Deduction** — If A→B and B→C, then A→C
- **Induction** — If A→C and B→C, then A→B
- **Abduction** — If A→B and A→C, then B→C
- **Modus Ponens** — If A and A→B, then B

### 💰 ECAN (Economic Attention Allocation)
Live parameter dashboard controlling simulated attention currency:
- Rent Rate, Wage Rate, Spreading Rate, Focus Boundary
- Global stimulus injection
- Real-time statistics (Total STI, In Focus, Forgotten)

## Architecture

```
opencog-viz/
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── index.js           # Express + Socket.IO server
│   │   ├── routes.js          # REST API endpoints
│   │   └── simulation/        # Simulation engines (separated)
│   │       ├── engine.js      # Orchestrator
│   │       ├── atomspace.js   # AtomSpace hypergraph
│   │       ├── pln.js         # PLN rule engine
│   │       └── ecan.js        # ECAN attention allocation
│   └── tests/
│       └── integration/
│           └── sync.test.js   # Data sync tests
├── client/                    # React frontend
│   └── src/
│       ├── App.jsx            # Dashboard layout
│       ├── components/
│       │   ├── AtomSpaceGraph.jsx
│       │   ├── PLNConsole.jsx
│       │   ├── ECANDashboard.jsx
│       │   └── NodeInspector.jsx
│       └── hooks/
│           └── useSocket.js   # Socket.IO hook
└── package.json               # Root scripts
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both server and client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/status
- WebSocket: ws://localhost:3001

## Running Tests

```bash
npm test
```

## Tech Stack

- **Frontend:** React 18, Vite 5, TailwindCSS 3, react-force-graph-2d
- **Backend:** Express 4, Socket.IO 4
- **Testing:** Vitest
- **Real-time:** WebSocket (Socket.IO) for live tick data
