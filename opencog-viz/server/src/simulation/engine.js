/**
 * Simulation Engine — Orchestrates the AtomSpace, PLN, and ECAN
 * subsystems in a unified tick loop.
 */

import { AtomSpace } from './atomspace.js';
import { PLN } from './pln.js';
import { ECAN } from './ecan.js';

export class SimulationEngine {
  constructor() {
    this.atomspace = new AtomSpace();
    this.pln = new PLN(this.atomspace);
    this.ecan = new ECAN(this.atomspace);
    this.running = false;
    this.tickInterval = null;
    this.tickRate = 1000; // ms between ticks
    this.onTick = null;   // callback(tickData)
  }

  /**
   * Seed the AtomSpace and prepare subsystems.
   */
  init() {
    this.atomspace.seed();
    this.ecan._updateStats();
    return this;
  }

  /**
   * Start the simulation loop.
   * @param {Function} onTick — called each tick with { graphData, plnResult, ecanStats }
   */
  start(onTick) {
    if (this.running) return;
    this.running = true;
    this.onTick = onTick;

    this.tickInterval = setInterval(() => {
      this._tick();
    }, this.tickRate);
  }

  stop() {
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  setTickRate(ms) {
    this.tickRate = Math.max(200, Math.min(5000, ms));
    if (this.running) {
      this.stop();
      this.start(this.onTick);
    }
  }

  /**
   * Single simulation tick.
   */
  _tick() {
    // 1. ECAN attention redistribution
    const ecanStats = this.ecan.tick();

    // 2. PLN rule evaluation (1–2 rules per tick)
    const plnResults = [];
    const rulesPerTick = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < rulesPerTick; i++) {
      const result = this.pln.evaluateRandom();
      if (result) plnResults.push(result);
    }

    // 3. Snapshot graph data
    const graphData = this.atomspace.toGraphData();

    // 4. Fire callback
    if (this.onTick) {
      this.onTick({
        graphData,
        plnResults,
        ecanStats,
        tick: this.ecan.tickCount,
      });
    }
  }

  /**
   * Return full system snapshot (for REST API).
   */
  getSnapshot() {
    return {
      graphData: this.atomspace.toGraphData(),
      plnLog: this.pln.getLog(50),
      plnRules: this.pln.getRules(),
      ecanParams: this.ecan.getParams(),
      ecanStats: this.ecan.getStats(),
      running: this.running,
      tickRate: this.tickRate,
    };
  }
}
