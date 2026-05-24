/**
 * ECAN — Economic Attention Allocation Network
 * Manages the "attentional currency" flowing through the AtomSpace.
 * Nodes pay rent to stay in the attentional focus and earn wages
 * when they participate in useful inferences.
 */

const DEFAULT_PARAMS = {
  rentRate: 0.04,           // STI decay per tick
  wageRate: 0.15,           // STI boost for useful nodes
  spreadingRate: 0.25,      // Fraction of STI spread to neighbours
  focusBoundary: 100,       // STI threshold for "attentional focus"
  maxSTI: 500,
  minSTI: 0,
  hebbianLearning: 0.05,    // Strength increase for co-activated links
  forgettingThreshold: 10,  // Nodes below this are "forgotten"
};

export class ECAN {
  constructor(atomspace) {
    /** @type {import('./atomspace.js').AtomSpace} */
    this.atomspace = atomspace;
    this.params = { ...DEFAULT_PARAMS };
    this.tickCount = 0;
    this.stats = {
      totalSTI: 0,
      inFocus: 0,
      forgotten: 0,
      avgSTI: 0,
    };
  }

  getParams() {
    return { ...this.params };
  }

  setParams(newParams) {
    for (const [key, value] of Object.entries(newParams)) {
      if (key in this.params && typeof value === 'number') {
        this.params[key] = value;
      }
    }
  }

  getStats() {
    return { ...this.stats, tickCount: this.tickCount };
  }

  /**
   * Run one ECAN tick: rent collection → spreading activation → stats.
   */
  tick() {
    this.tickCount++;
    const nodes = this.atomspace.getAllNodes();

    // 1. Collect rent (attention decay)
    for (const node of nodes) {
      const rent = node.av.sti * this.params.rentRate;
      this.atomspace.updateAttention(node.id, -rent);
    }

    // 2. Spreading activation
    for (const node of nodes) {
      if (node.av.sti > this.params.focusBoundary) {
        const neighborIds = this.atomspace.getNeighborIds(node.id);
        if (neighborIds.length > 0) {
          const spread = node.av.sti * this.params.spreadingRate / neighborIds.length;
          for (const nId of neighborIds) {
            this.atomspace.updateAttention(nId, spread * 0.5);
          }
          this.atomspace.updateAttention(node.id, -spread * neighborIds.length * 0.3);
        }
      }
    }

    // 3. Random stimulus (simulates external input / environmental interaction)
    if (Math.random() < 0.3) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (randomNode) {
        this.atomspace.updateAttention(randomNode.id, 30 + Math.random() * 50);
      }
    }

    // 4. Update statistics
    this._updateStats();

    return this.stats;
  }

  /**
   * Manually inject attention into a specific node.
   */
  stimulate(nodeId, amount) {
    this.atomspace.updateAttention(nodeId, amount);
  }

  /**
   * Inject attention across all nodes uniformly.
   */
  globalStimulus(amount) {
    const nodes = this.atomspace.getAllNodes();
    for (const node of nodes) {
      this.atomspace.updateAttention(node.id, amount / nodes.length);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                   */
  /* ------------------------------------------------------------------ */

  _updateStats() {
    const nodes = this.atomspace.getAllNodes();
    let totalSTI = 0;
    let inFocus = 0;
    let forgotten = 0;

    for (const node of nodes) {
      totalSTI += node.av.sti;
      if (node.av.sti >= this.params.focusBoundary) inFocus++;
      if (node.av.sti <= this.params.forgettingThreshold) forgotten++;
    }

    this.stats = {
      totalSTI: +totalSTI.toFixed(1),
      inFocus,
      forgotten,
      avgSTI: +(totalSTI / (nodes.length || 1)).toFixed(1),
      nodeCount: nodes.length,
    };
  }
}
