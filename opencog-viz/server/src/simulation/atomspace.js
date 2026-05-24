/**
 * AtomSpace — In-memory hypergraph of Atoms (Nodes + Links).
 * Each Atom carries a TruthValue (strength, confidence) and an
 * AttentionValue (STI, LTI) that the ECAN subsystem modulates.
 */

const NODE_TYPES = ['ConceptNode', 'PredicateNode', 'SchemaNode', 'NumberNode'];
const LINK_TYPES = ['InheritanceLink', 'EvaluationLink', 'SimilarityLink', 'ListLink', 'ImplicationLink'];

const CONCEPT_LABELS = [
  'animal', 'mammal', 'cat', 'dog', 'bird', 'fish', 'reptile',
  'food', 'meat', 'fruit', 'vegetable', 'water',
  'movement', 'run', 'swim', 'fly', 'walk',
  'emotion', 'happy', 'fear', 'anger', 'calm',
  'intelligence', 'learning', 'memory', 'reasoning', 'perception',
  'language', 'syntax', 'semantics', 'grammar', 'word',
  'color', 'red', 'blue', 'green', 'bright',
  'size', 'large', 'small', 'medium', 'tiny',
  'habitat', 'forest', 'ocean', 'sky', 'desert',
];

let nextId = 1;

export class AtomSpace {
  constructor() {
    /** @type {Map<string, object>} */
    this.atoms = new Map();
    /** @type {Array<object>} */
    this.links = [];
  }

  /* ------------------------------------------------------------------ */
  /*  Atom CRUD                                                          */
  /* ------------------------------------------------------------------ */

  addNode(type, label, truthValue, attentionValue) {
    const id = `node-${nextId++}`;
    const atom = {
      id,
      type: type || 'ConceptNode',
      label: label || `concept_${id}`,
      tv: { strength: truthValue?.strength ?? 0.5, confidence: truthValue?.confidence ?? 0.5 },
      av: { sti: attentionValue?.sti ?? Math.random() * 200, lti: attentionValue?.lti ?? Math.random() * 50 },
    };
    this.atoms.set(id, atom);
    return atom;
  }

  addLink(type, sourceId, targetId, truthValue) {
    const id = `link-${nextId++}`;
    const link = {
      id,
      type: type || 'InheritanceLink',
      source: sourceId,
      target: targetId,
      tv: { strength: truthValue?.strength ?? 0.5, confidence: truthValue?.confidence ?? 0.3 },
    };
    this.links.push(link);
    return link;
  }

  getNode(id) {
    return this.atoms.get(id);
  }

  getAllNodes() {
    return Array.from(this.atoms.values());
  }

  getAllLinks() {
    return [...this.links];
  }

  /* ------------------------------------------------------------------ */
  /*  Attention helpers                                                  */
  /* ------------------------------------------------------------------ */

  updateAttention(id, delta) {
    const atom = this.atoms.get(id);
    if (!atom) return;
    atom.av.sti = Math.max(0, Math.min(500, atom.av.sti + delta));
  }

  setAttention(id, sti) {
    const atom = this.atoms.get(id);
    if (!atom) return;
    atom.av.sti = Math.max(0, Math.min(500, sti));
  }

  updateTruthValue(id, tv) {
    const atom = this.atoms.get(id);
    if (!atom) return;
    atom.tv.strength = Math.max(0, Math.min(1, tv.strength));
    atom.tv.confidence = Math.max(0, Math.min(1, tv.confidence));
  }

  /* ------------------------------------------------------------------ */
  /*  Neighbours                                                         */
  /* ------------------------------------------------------------------ */

  getNeighborIds(nodeId) {
    const neighbors = new Set();
    for (const link of this.links) {
      if (link.source === nodeId) neighbors.add(link.target);
      if (link.target === nodeId) neighbors.add(link.source);
    }
    return [...neighbors];
  }

  /* ------------------------------------------------------------------ */
  /*  Serialise for the frontend                                         */
  /* ------------------------------------------------------------------ */

  toGraphData() {
    return {
      nodes: this.getAllNodes().map((n) => ({ ...n })),
      links: this.getAllLinks().map((l) => ({ ...l })),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Seed with initial data                                             */
  /* ------------------------------------------------------------------ */

  seed() {
    const labels = [...CONCEPT_LABELS];
    const nodeIds = [];

    // Create concept nodes
    for (const label of labels) {
      const node = this.addNode(
        NODE_TYPES[Math.floor(Math.random() * 2)], // ConceptNode or PredicateNode
        label,
        { strength: 0.3 + Math.random() * 0.7, confidence: 0.2 + Math.random() * 0.6 },
        { sti: 20 + Math.random() * 180, lti: Math.random() * 30 },
      );
      nodeIds.push(node.id);
    }

    // Create structured links (hierarchical + associative)
    const hierarchies = [
      ['animal', 'mammal'], ['mammal', 'cat'], ['mammal', 'dog'],
      ['animal', 'bird'], ['animal', 'fish'], ['animal', 'reptile'],
      ['food', 'meat'], ['food', 'fruit'], ['food', 'vegetable'],
      ['emotion', 'happy'], ['emotion', 'fear'], ['emotion', 'anger'], ['emotion', 'calm'],
      ['intelligence', 'learning'], ['intelligence', 'memory'], ['intelligence', 'reasoning'],
      ['language', 'syntax'], ['language', 'semantics'], ['language', 'grammar'],
      ['color', 'red'], ['color', 'blue'], ['color', 'green'],
      ['size', 'large'], ['size', 'small'], ['size', 'medium'],
      ['habitat', 'forest'], ['habitat', 'ocean'], ['habitat', 'sky'], ['habitat', 'desert'],
    ];

    const nodeByLabel = {};
    for (const atom of this.atoms.values()) {
      nodeByLabel[atom.label] = atom.id;
    }

    for (const [parent, child] of hierarchies) {
      if (nodeByLabel[parent] && nodeByLabel[child]) {
        this.addLink('InheritanceLink', nodeByLabel[child], nodeByLabel[parent], {
          strength: 0.7 + Math.random() * 0.3,
          confidence: 0.5 + Math.random() * 0.4,
        });
      }
    }

    // Add some cross-domain similarity links
    const crossLinks = [
      ['cat', 'small'], ['dog', 'medium'], ['bird', 'fly'], ['fish', 'swim'],
      ['forest', 'green'], ['ocean', 'blue'], ['desert', 'bright'],
      ['learning', 'memory'], ['reasoning', 'perception'],
      ['run', 'movement'], ['swim', 'movement'], ['fly', 'movement'], ['walk', 'movement'],
    ];

    for (const [a, b] of crossLinks) {
      if (nodeByLabel[a] && nodeByLabel[b]) {
        this.addLink('SimilarityLink', nodeByLabel[a], nodeByLabel[b], {
          strength: 0.4 + Math.random() * 0.5,
          confidence: 0.3 + Math.random() * 0.4,
        });
      }
    }

    return this;
  }
}
