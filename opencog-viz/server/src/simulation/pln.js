/**
 * PLN — Probabilistic Logic Networks
 * Simulates logical rule evaluations (Deduction, Induction, Abduction,
 * Modus Ponens) that traverse the AtomSpace graph and produce new
 * truth-value inferences.
 */

const RULES = [
  {
    name: 'Deduction',
    description: 'If A→B and B→C then A→C',
    symbol: '⊢',
    color: '#00f0ff',
  },
  {
    name: 'Induction',
    description: 'If A→C and B→C then A→B',
    symbol: '⊣',
    color: '#8b5cf6',
  },
  {
    name: 'Abduction',
    description: 'If A→B and A→C then B→C',
    symbol: '⇝',
    color: '#f59e0b',
  },
  {
    name: 'ModusPonens',
    description: 'If A and A→B then B',
    symbol: '→',
    color: '#10b981',
  },
];

export class PLN {
  constructor(atomspace) {
    /** @type {import('./atomspace.js').AtomSpace} */
    this.atomspace = atomspace;
    /** @type {Array<object>} */
    this.log = [];
    this.maxLogSize = 200;
  }

  getRules() {
    return RULES.map((r) => ({ ...r }));
  }

  getLog(limit = 50) {
    return this.log.slice(-limit);
  }

  /**
   * Run one random rule evaluation and return the inference result.
   */
  evaluateRandom() {
    const rule = RULES[Math.floor(Math.random() * RULES.length)];
    const nodes = this.atomspace.getAllNodes();
    const links = this.atomspace.getAllLinks();

    if (nodes.length < 3 || links.length < 2) return null;

    let result = null;

    switch (rule.name) {
      case 'Deduction':
        result = this._deduction(nodes, links, rule);
        break;
      case 'Induction':
        result = this._induction(nodes, links, rule);
        break;
      case 'Abduction':
        result = this._abduction(nodes, links, rule);
        break;
      case 'ModusPonens':
        result = this._modusPonens(nodes, links, rule);
        break;
    }

    if (result) {
      result.timestamp = Date.now();
      this.log.push(result);
      if (this.log.length > this.maxLogSize) {
        this.log = this.log.slice(-this.maxLogSize);
      }
    }

    return result;
  }

  /* ------------------------------------------------------------------ */
  /*  Rule implementations                                               */
  /* ------------------------------------------------------------------ */

  _pickRandomLink(links) {
    return links[Math.floor(Math.random() * links.length)];
  }

  _findLinksFrom(nodeId, links) {
    return links.filter((l) => l.source === nodeId);
  }

  _findLinksTo(nodeId, links) {
    return links.filter((l) => l.target === nodeId);
  }

  /** Deduction: A→B ∧ B→C ⟹ A→C */
  _deduction(nodes, links, rule) {
    const ab = this._pickRandomLink(links);
    const bLinks = this._findLinksFrom(ab.target, links);
    if (bLinks.length === 0) return null;
    const bc = bLinks[Math.floor(Math.random() * bLinks.length)];

    const nodeA = this.atomspace.getNode(ab.source);
    const nodeB = this.atomspace.getNode(ab.target);
    const nodeC = this.atomspace.getNode(bc.target);
    if (!nodeA || !nodeB || !nodeC || nodeA.id === nodeC.id) return null;

    // Deduction formula: sAC = sAB * sBC
    const strength = ab.tv.strength * bc.tv.strength;
    const confidence = ab.tv.confidence * bc.tv.confidence * 0.9;

    // Boost attention on involved nodes
    this.atomspace.updateAttention(nodeA.id, 15);
    this.atomspace.updateAttention(nodeB.id, 10);
    this.atomspace.updateAttention(nodeC.id, 15);

    return {
      rule: rule.name,
      symbol: rule.symbol,
      color: rule.color,
      premises: [
        `${nodeA.label} → ${nodeB.label} (s=${ab.tv.strength.toFixed(2)})`,
        `${nodeB.label} → ${nodeC.label} (s=${bc.tv.strength.toFixed(2)})`,
      ],
      conclusion: `${nodeA.label} → ${nodeC.label}`,
      tv: { strength: +strength.toFixed(3), confidence: +confidence.toFixed(3) },
      involvedNodes: [nodeA.id, nodeB.id, nodeC.id],
    };
  }

  /** Induction: A→C ∧ B→C ⟹ A→B */
  _induction(nodes, links, rule) {
    const ac = this._pickRandomLink(links);
    const cLinks = this._findLinksTo(ac.target, links);
    const bcCandidates = cLinks.filter((l) => l.source !== ac.source);
    if (bcCandidates.length === 0) return null;
    const bc = bcCandidates[Math.floor(Math.random() * bcCandidates.length)];

    const nodeA = this.atomspace.getNode(ac.source);
    const nodeB = this.atomspace.getNode(bc.source);
    const nodeC = this.atomspace.getNode(ac.target);
    if (!nodeA || !nodeB || !nodeC) return null;

    const strength = ac.tv.strength * bc.tv.strength * 0.8;
    const confidence = Math.min(ac.tv.confidence, bc.tv.confidence) * 0.7;

    this.atomspace.updateAttention(nodeA.id, 10);
    this.atomspace.updateAttention(nodeB.id, 10);

    return {
      rule: rule.name,
      symbol: rule.symbol,
      color: rule.color,
      premises: [
        `${nodeA.label} → ${nodeC.label} (s=${ac.tv.strength.toFixed(2)})`,
        `${nodeB.label} → ${nodeC.label} (s=${bc.tv.strength.toFixed(2)})`,
      ],
      conclusion: `${nodeA.label} → ${nodeB.label}`,
      tv: { strength: +strength.toFixed(3), confidence: +confidence.toFixed(3) },
      involvedNodes: [nodeA.id, nodeB.id, nodeC.id],
    };
  }

  /** Abduction: A→B ∧ A→C ⟹ B→C */
  _abduction(nodes, links, rule) {
    const ab = this._pickRandomLink(links);
    const aLinks = this._findLinksFrom(ab.source, links);
    const acCandidates = aLinks.filter((l) => l.target !== ab.target);
    if (acCandidates.length === 0) return null;
    const ac = acCandidates[Math.floor(Math.random() * acCandidates.length)];

    const nodeA = this.atomspace.getNode(ab.source);
    const nodeB = this.atomspace.getNode(ab.target);
    const nodeC = this.atomspace.getNode(ac.target);
    if (!nodeA || !nodeB || !nodeC) return null;

    const strength = ab.tv.strength * ac.tv.strength * 0.7;
    const confidence = Math.min(ab.tv.confidence, ac.tv.confidence) * 0.6;

    this.atomspace.updateAttention(nodeB.id, 12);
    this.atomspace.updateAttention(nodeC.id, 12);

    return {
      rule: rule.name,
      symbol: rule.symbol,
      color: rule.color,
      premises: [
        `${nodeA.label} → ${nodeB.label} (s=${ab.tv.strength.toFixed(2)})`,
        `${nodeA.label} → ${nodeC.label} (s=${ac.tv.strength.toFixed(2)})`,
      ],
      conclusion: `${nodeB.label} → ${nodeC.label}`,
      tv: { strength: +strength.toFixed(3), confidence: +confidence.toFixed(3) },
      involvedNodes: [nodeA.id, nodeB.id, nodeC.id],
    };
  }

  /** Modus Ponens: A ∧ A→B ⟹ B */
  _modusPonens(nodes, links, rule) {
    const link = this._pickRandomLink(links);
    const nodeA = this.atomspace.getNode(link.source);
    const nodeB = this.atomspace.getNode(link.target);
    if (!nodeA || !nodeB) return null;

    const strength = nodeA.tv.strength * link.tv.strength;
    const confidence = nodeA.tv.confidence * link.tv.confidence * 0.95;

    // Update target node truth value (simulate inference)
    const newStrength = (nodeB.tv.strength + strength) / 2;
    const newConf = Math.max(nodeB.tv.confidence, confidence);
    this.atomspace.updateTruthValue(nodeB.id, { strength: newStrength, confidence: newConf });
    this.atomspace.updateAttention(nodeA.id, 8);
    this.atomspace.updateAttention(nodeB.id, 20);

    return {
      rule: rule.name,
      symbol: rule.symbol,
      color: rule.color,
      premises: [
        `${nodeA.label} (s=${nodeA.tv.strength.toFixed(2)})`,
        `${nodeA.label} → ${nodeB.label} (s=${link.tv.strength.toFixed(2)})`,
      ],
      conclusion: `${nodeB.label} (updated)`,
      tv: { strength: +newStrength.toFixed(3), confidence: +newConf.toFixed(3) },
      involvedNodes: [nodeA.id, nodeB.id],
    };
  }
}
