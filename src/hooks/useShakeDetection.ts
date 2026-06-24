import { useEffect } from 'react';

export function useShakeDetection(onShake: () => void, shakeThreshold = 18) {
  useEffect(() => {
    let lastTime = Date.now();
    let lastX = 0, lastY = 0, lastZ = 0;
    
    // Fallback for permissions if iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          await (DeviceMotionEvent as any).requestPermission();
        } catch (e) {
          console.warn("Permission denied for device motion", e);
        }
      }
    };
    
    // We can try to request it if it's available, but usually it requires user interaction.
    // So we just attach the listener directly.

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;
      
      const { x, y, z } = current;
      if (x === null || y === null || z === null) return;
      
      const currentTime = Date.now();
      const timeDifference = currentTime - lastTime;
      
      if (timeDifference > 100) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        
        // Acceleration magnitude roughly
        const totalAccel = deltaX + deltaY + deltaZ;
        
        if (totalAccel > shakeThreshold) {
          onShake();
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
        lastTime = currentTime;
      }
    };
    
    window.addEventListener('devicemotion', handleDeviceMotion, true);
    
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion, true);
    };
  }, [onShake, shakeThreshold]);
}
