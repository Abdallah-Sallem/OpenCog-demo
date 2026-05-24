/**
 * REST API routes for the OpenCog Viz server.
 */

import { Router } from 'express';

export function createRoutes(engine) {
  const router = Router();

  /** Full system snapshot */
  router.get('/status', (_req, res) => {
    res.json(engine.getSnapshot());
  });

  /** Current AtomSpace graph */
  router.get('/atomspace', (_req, res) => {
    res.json(engine.atomspace.toGraphData());
  });

  /** Single node details */
  router.get('/atomspace/node/:id', (req, res) => {
    const node = engine.atomspace.getNode(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    const neighbors = engine.atomspace.getNeighborIds(node.id);
    res.json({ ...node, neighbors });
  });

  /** PLN rules list */
  router.get('/pln/rules', (_req, res) => {
    res.json(engine.pln.getRules());
  });

  /** PLN evaluation log */
  router.get('/pln/log', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(engine.pln.getLog(limit));
  });

  /** ECAN parameters (GET / POST) */
  router.get('/ecan/params', (_req, res) => {
    res.json(engine.ecan.getParams());
  });

  router.post('/ecan/params', (req, res) => {
    engine.ecan.setParams(req.body);
    res.json(engine.ecan.getParams());
  });

  /** ECAN stats */
  router.get('/ecan/stats', (_req, res) => {
    res.json(engine.ecan.getStats());
  });

  /** Simulation controls */
  router.post('/simulation/start', (_req, res) => {
    // The socket handler manages the actual start; this is a convenience endpoint
    res.json({ running: engine.running });
  });

  router.post('/simulation/stop', (_req, res) => {
    engine.stop();
    res.json({ running: engine.running });
  });

  router.post('/simulation/tick-rate', (req, res) => {
    const { tickRate } = req.body;
    if (typeof tickRate === 'number') {
      engine.setTickRate(tickRate);
    }
    res.json({ tickRate: engine.tickRate });
  });

  return router;
}
