import { useState, useEffect } from 'react';

export function useTelemetry() {
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let isActive = true;

    const connectWebSocket = async () => {
      try {
        // Fetch a real token from our new auth layer
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'user@safebreath.com', password: 'user123' })
        });
        
        const data = await response.json();
        const token = data?.data?.accessToken;

        if (!token || !isActive) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}?token=${token}`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Connected to Telemetry WebSocket stream');
          setIsConnected(true);
          
          // Phase 2: Start generating and sending mocked telemetry packets to the backend
          let sequenceId = 1;
          const intervalId = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              const packet = {
                type: 'TELEMETRY_INGEST',
                payload: {
                  bpm: 70 + Math.floor(Math.random() * 10), // Safe normal reading
                  timestamp: Date.now(),
                  sequenceId: sequenceId++
                }
              };
              ws.send(JSON.stringify(packet));
            }
          }, 2000);
          
          ws.onclose = () => {
             clearInterval(intervalId);
          };
        };

        ws.onmessage = (event) => {
          try {
            const msgData = JSON.parse(event.data);
            if (msgData.type === 'TELEMETRY_UPDATE') {
              setLiveBpm(msgData.payload.bpm);
            }
          } catch (err) {
            console.error('Failed to parse telemetry message', err);
          }
        };

        ws.onclose = () => {
          console.log('Telemetry WebSocket stream disconnected');
          setIsConnected(false);
        };
      } catch (err) {
        console.error('Auth or WS connection failed', err);
      }
    };

    connectWebSocket();

    return () => {
      isActive = false;
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return { liveBpm, isConnected };
}
