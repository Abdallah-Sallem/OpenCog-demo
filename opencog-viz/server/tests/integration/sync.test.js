/**
 * Integration tests — Verify data synchronisation between
 * the backend simulation engine and the API/WebSocket layer.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { SimulationEngine } from '../../src/simulation/engine.js';
import { createRoutes } from '../../src/routes.js';

let httpServer;
let engine;
let clientSocket;
const PORT = 3099;

beforeAll(async () => {
  const app = express();
  app.use(express.json());

  engine = new SimulationEngine();
  engine.init();
  app.use('/api', createRoutes(engine));

  httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.emit('snapshot', engine.getSnapshot());
    if (!engine.running) {
      engine.start((tickData) => {
        io.emit('tick', tickData);
      });
    }
    socket.on('ecan:params', (params) => {
      engine.ecan.setParams(params);
      io.emit('ecan:params-updated', engine.ecan.getParams());
    });
  });

  await new Promise((resolve) => httpServer.listen(PORT, resolve));
  clientSocket = ioClient(`http://localhost:${PORT}`);
  await new Promise((resolve) => clientSocket.on('connect', resolve));
});

afterAll(async () => {
  engine.stop();
  clientSocket.disconnect();
  await new Promise((resolve) => httpServer.close(resolve));
});

/* -------------------------------------------------------------------- */
/*  REST API Tests                                                       */
/* -------------------------------------------------------------------- */

describe('REST API — /api/status', () => {
  it('returns a full system snapshot', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/status`);
    const data = await res.json();

    expect(data).toHaveProperty('graphData');
    expect(data).toHaveProperty('plnLog');
    expect(data).toHaveProperty('ecanParams');
    expect(data).toHaveProperty('ecanStats');
    expect(data.graphData.nodes.length).toBeGreaterThan(0);
    expect(data.graphData.links.length).toBeGreaterThan(0);
  });
});

describe('REST API — /api/atomspace', () => {
  it('returns graph data matching engine state', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/atomspace`);
    const data = await res.json();
    const engineData = engine.atomspace.toGraphData();

    expect(data.nodes.length).toBe(engineData.nodes.length);
    expect(data.links.length).toBe(engineData.links.length);
  });

  it('each node has required tv and av fields', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/atomspace`);
    const data = await res.json();

    for (const node of data.nodes) {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('tv');
      expect(node).toHaveProperty('av');
      expect(node.tv).toHaveProperty('strength');
      expect(node.tv).toHaveProperty('confidence');
      expect(node.av).toHaveProperty('sti');
    }
  });
});

describe('REST API — /api/ecan/params', () => {
  it('returns current ECAN parameters', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/ecan/params`);
    const data = await res.json();

    expect(data).toHaveProperty('rentRate');
    expect(data).toHaveProperty('wageRate');
    expect(data).toHaveProperty('spreadingRate');
    expect(data).toHaveProperty('focusBoundary');
  });

  it('updates parameters via POST', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/ecan/params`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rentRate: 0.1 }),
    });
    const data = await res.json();

    expect(data.rentRate).toBe(0.1);
    expect(engine.ecan.getParams().rentRate).toBe(0.1);

    // Reset
    engine.ecan.setParams({ rentRate: 0.04 });
  });
});

/* -------------------------------------------------------------------- */
/*  WebSocket Tests                                                      */
/* -------------------------------------------------------------------- */

describe('WebSocket — Snapshot on connect', () => {
  it('receives initial snapshot', async () => {
    const newClient = ioClient(`http://localhost:${PORT}`);
    const snapshot = await new Promise((resolve) => {
      newClient.on('snapshot', resolve);
    });

    expect(snapshot).toHaveProperty('graphData');
    expect(snapshot).toHaveProperty('ecanParams');
    expect(snapshot.graphData.nodes.length).toBeGreaterThan(0);

    newClient.disconnect();
  });
});

describe('WebSocket — Tick data synchronisation', () => {
  it('receives tick events with graph data', async () => {
    const tickData = await new Promise((resolve) => {
      clientSocket.once('tick', resolve);
    });

    expect(tickData).toHaveProperty('graphData');
    expect(tickData).toHaveProperty('ecanStats');
    expect(tickData).toHaveProperty('tick');
    expect(tickData.graphData.nodes.length).toBeGreaterThan(0);
  });

  it('tick graph data matches engine state', async () => {
    const tickData = await new Promise((resolve) => {
      clientSocket.once('tick', resolve);
    });

    const engineNodes = engine.atomspace.getAllNodes();
    expect(tickData.graphData.nodes.length).toBe(engineNodes.length);
  });
});

describe('WebSocket — ECAN params sync', () => {
  it('broadcasts updated params to all clients', async () => {
    const updatePromise = new Promise((resolve) => {
      clientSocket.once('ecan:params-updated', resolve);
    });

    clientSocket.emit('ecan:params', { spreadingRate: 0.5 });
    const updatedParams = await updatePromise;

    expect(updatedParams.spreadingRate).toBe(0.5);
    expect(engine.ecan.getParams().spreadingRate).toBe(0.5);

    // Reset
    engine.ecan.setParams({ spreadingRate: 0.25 });
  });
});
