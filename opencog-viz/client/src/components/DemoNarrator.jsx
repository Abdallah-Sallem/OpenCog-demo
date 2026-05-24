import { useState, useEffect, useRef } from 'react';

const PHASES = [
  {
    id: 1,
    title: 'Phase 1: The AtomSpace Hypergraph',
    duration: 30,
    script: 'Welcome to the OpenCog Cognitive Synergy Visualizer. Unlike traditional deep learning black boxes, OpenCog relies on the AtomSpace—a live-rendering typed hypergraph representing conceptual memory. Here, nodes and links are first-class Atoms, carrying explicit Truth Values and Attention Values. By combining symbolic reasoning with attention allocation, we achieve cognitive synergy: multiple subsystems cooperating to solve complex tasks.',
    highlights: ['node-24', 'node-25', 'node-26', 'node-27', 'node-28'], // intelligence, learning, memory, reasoning, perception
    links: [],
  },
  {
    id: 2,
    title: 'Phase 2: Economic Attention Allocation (ECAN)',
    duration: 30,
    script: 'We are now demonstrating the Economic Attention Allocation subsystem, or ECAN. ECAN acts as the system\'s short-term memory focus. Watch as we adjust the Rent and Spreading rates. Nodes pay rent to remain active. When rent increases, less active concepts quickly fade into the forgotten pool, while high-value clusters remain illuminated. This dynamic focus allows the system to budget its computational resources.',
    highlights: [],
    links: [],
    action: (socketActions) => {
      // Simulate slider manipulation
      socketActions.updateParams({ rentRate: 0.12, spreadingRate: 0.15, focusBoundary: 150 });
      setTimeout(() => {
        socketActions.updateParams({ rentRate: 0.02, spreadingRate: 0.45, focusBoundary: 80 });
      }, 10000);
      setTimeout(() => {
        socketActions.updateParams({ rentRate: 0.04, spreadingRate: 0.25, focusBoundary: 100 });
      }, 20000);
    },
  },
  {
    id: 3,
    title: 'Phase 3: PLN Reasoning & Telemetry',
    duration: 40,
    script: 'Next, we trigger a PLN Reasoning Mission. The Probabilistic Logic Network performs inferences over the AtomSpace, handling uncertainty via strength and confidence metrics. In the graph, you can see a deduction path highlighted from perception, through reasoning, to intelligence. As PLN draws new conclusions, it updates the truth values and feeds back attention to the relevant nodes, which you can see scrolling in real-time in the PLN console.',
    highlights: ['node-24', 'node-27', 'node-28'], // intelligence, reasoning, perception
    links: [
      { source: 'node-28', target: 'node-27' }, // perception -> reasoning
      { source: 'node-27', target: 'node-24' }, // reasoning -> intelligence
    ],
    action: (socketActions) => {
      socketActions.globalStimulus(300);
    },
  },
  {
    id: 4,
    title: 'Phase 4: Scaling to AGI with MeTTa',
    duration: 20,
    script: 'As the system settles back into equilibrium, we look toward the future. The OpenCog Hyperon framework leverages the MeTTa language to scale these cognitive synergy dynamics to massive distributed environments, paving the way for true, scalable artificial general intelligence.',
    highlights: [],
    links: [],
    action: (socketActions) => {
      socketActions.updateParams({ rentRate: 0.04, wageRate: 0.15, spreadingRate: 0.25, focusBoundary: 100 });
    },
  },
];

export default function DemoNarrator({ socketActions, onHighlightChange }) {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(120);
  const [currentCaption, setCurrentCaption] = useState('');
  const speechRef = useRef(null);

  // Auto-start walkthrough if URL contains ?demo=true
  useEffect(() => {
    if (window.location.search.includes('demo=true')) {
      // Small delay to allow graph initialization
      const timer = setTimeout(() => {
        startWalkthrough();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update parent with current highlighted nodes/links
  useEffect(() => {
    if (active) {
      const phase = PHASES[phaseIndex];
      onHighlightChange?.(phase.highlights || [], phase.links || []);
    } else {
      onHighlightChange?.([], []);
    }
  }, [active, phaseIndex]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly faster to sound natural and match pacing
      utterance.pitch = 1.0;
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startWalkthrough = () => {
    setActive(true);
    setPhaseIndex(0);
    setTimeLeft(PHASES[0].duration);
    setTotalTimeLeft(120);
    setCurrentCaption(PHASES[0].script);
    speakText(PHASES[0].script);

    // Execute first phase action
    if (PHASES[0].action) PHASES[0].action(socketActions);
  };

  const stopWalkthrough = () => {
    setActive(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onHighlightChange?.([], []);
    // Reset params to default
    socketActions.updateParams({ rentRate: 0.04, wageRate: 0.15, spreadingRate: 0.25, focusBoundary: 100 });
  };

  // Timer loop
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setTotalTimeLeft((t) => {
        if (t <= 1) {
          stopWalkthrough();
          return 0;
        }
        return t - 1;
      });

      setTimeLeft((t) => {
        if (t <= 1) {
          // Move to next phase
          const nextIndex = phaseIndex + 1;
          if (nextIndex < PHASES.length) {
            setPhaseIndex(nextIndex);
            const nextPhase = PHASES[nextIndex];
            setCurrentCaption(nextPhase.script);
            speakText(nextPhase.script);
            if (nextPhase.action) nextPhase.action(socketActions);
            return nextPhase.duration;
          } else {
            stopWalkthrough();
            return 0;
          }
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, phaseIndex]);

  if (!active) {
    return (
      <button
        id="btn-start-walkthrough"
        onClick={startWalkthrough}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider
                   bg-neon-purple/20 border border-neon-purple/40 text-purple-300
                   hover:bg-neon-purple/30 hover:border-neon-purple/60 hover:text-white
                   transition-all duration-200 animate-pulse-glow"
      >
        🎬 Run Technical Demo (120s)
      </button>
    );
  }

  const currentPhase = PHASES[phaseIndex];
  const progressPercent = ((currentPhase.duration - timeLeft) / currentPhase.duration) * 100;
  const totalProgressPercent = ((120 - totalTimeLeft) / 120) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Subtitles & Status Bar (Renders at top header space) */}
      <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/40 border border-white/5 font-mono text-xs">
        <span className="text-neon-purple animate-pulse">● DEMO WALKTHROUGH</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">{currentPhase.title}</span>
        <span className="text-gray-600">|</span>
        <span className="text-neon-cyan">{totalTimeLeft}s remaining</span>
      </div>

      <button
        onClick={stopWalkthrough}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider
                   bg-rose-500/20 border border-rose-500/40 text-rose-300
                   hover:bg-rose-500/30 hover:text-white transition-all"
      >
        ⏹ Stop Demo
      </button>

      {/* Subtitle Caption Overlay Panel - Positioned fixed at bottom center of viewport */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[700px] glass-panel p-4 shadow-neon-purple">
        {/* Progress bars */}
        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-neon-purple transition-all duration-1000"
            style={{ width: `${totalProgressPercent}%` }}
          />
        </div>
        
        {/* Caption text */}
        <div className="text-center font-sans text-sm text-gray-200 leading-relaxed font-medium">
          "{currentCaption}"
        </div>
        
        <div className="mt-2 text-center text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Narrator Audio Active • Phase {phaseIndex + 1} of 4 ({timeLeft}s)
        </div>
      </div>
    </div>
  );
}
