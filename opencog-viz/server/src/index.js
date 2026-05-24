/**
 * OpenCog Viz Server — Express + Socket.IO entry point.
 * Bridges the simulation engines with the React frontend via
 * WebSocket events and REST endpoints.
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SimulationEngine } from './simulation/engine.js';
import { createRoutes } from './routes.js';

const PORT = process.env.PORT || 3001;

// ── Bootstrap ────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Simulation Engine ────────────────────────────────────────────────
const engine = new SimulationEngine();
engine.init();

// Mount REST routes
app.use('/api', createRoutes(engine));

// ── Socket.IO ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  // Send initial snapshot
  socket.emit('snapshot', engine.getSnapshot());

  // Start simulation if not running
  if (!engine.running) {
    engine.start((tickData) => {
      io.emit('tick', tickData);
    });
    console.log('[engine] simulation started');
  }

  // Handle ECAN parameter updates
  socket.on('ecan:params', (params) => {
    engine.ecan.setParams(params);
    io.emit('ecan:params-updated', engine.ecan.getParams());
  });

  // Handle tick rate changes
  socket.on('simulation:tick-rate', (rate) => {
    engine.setTickRate(rate);
  });

  // Handle manual node stimulation
  socket.on('ecan:stimulate', ({ nodeId, amount }) => {
    engine.ecan.stimulate(nodeId, amount || 50);
  });

  // Handle global stimulus
  socket.on('ecan:global-stimulus', ({ amount }) => {
    engine.ecan.globalStimulus(amount || 200);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ── Start ────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n  🧠 OpenCog Viz Server running on http://localhost:${PORT}`);
  console.log(`     REST API:  http://localhost:${PORT}/api/status`);
  console.log(`     WebSocket: ws://localhost:${PORT}\n`);
});
