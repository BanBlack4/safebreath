import { useState, useEffect } from 'react';

export function useTelemetry() {
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In dev mode, we connect to the same port.
    // In production, we'd also connect to the same port (3000) or current host.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    let ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to Telemetry WebSocket stream');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'TELEMETRY_UPDATE') {
          setLiveBpm(data.payload.bpm);
        }
      } catch (err) {
        console.error('Failed to parse telemetry message', err);
      }
    };

    ws.onclose = () => {
      console.log('Telemetry WebSocket stream disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return { liveBpm, isConnected };
}
