import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook that manages the Socket.IO connection to the backend
 * simulation server, providing live graph data, PLN log, and ECAN stats.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [plnLog, setPlnLog] = useState([]);
  const [ecanStats, setEcanStats] = useState({});
  const [ecanParams, setEcanParams] = useState({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Initial snapshot
    socket.on('snapshot', (data) => {
      setGraphData(data.graphData);
      setPlnLog(data.plnLog || []);
      setEcanParams(data.ecanParams || {});
      setEcanStats(data.ecanStats || {});
    });

    // Live ticks
    socket.on('tick', (data) => {
      setGraphData(data.graphData);
      setEcanStats(data.ecanStats);
      setTick(data.tick);
      if (data.plnResults && data.plnResults.length > 0) {
        setPlnLog((prev) => [...prev.slice(-150), ...data.plnResults]);
      }
    });

    // ECAN param sync
    socket.on('ecan:params-updated', (params) => {
      setEcanParams(params);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateEcanParams = useCallback((params) => {
    socketRef.current?.emit('ecan:params', params);
  }, []);

  const stimulateNode = useCallback((nodeId, amount) => {
    socketRef.current?.emit('ecan:stimulate', { nodeId, amount });
  }, []);

  const globalStimulus = useCallback((amount) => {
    socketRef.current?.emit('ecan:global-stimulus', { amount });
  }, []);

  const setTickRate = useCallback((rate) => {
    socketRef.current?.emit('simulation:tick-rate', rate);
  }, []);

  return {
    connected,
    graphData,
    plnLog,
    ecanStats,
    ecanParams,
    tick,
    updateEcanParams,
    stimulateNode,
    globalStimulus,
    setTickRate,
  };
}
