/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Custom types for the connection result
export interface BluetoothConnectionResult {
  device: any;
  server: any;
  disconnect: () => void;
}

export type HeartRateCallback = (bpm: number) => void;

/**
 * Escanea servicios de 'Heart Rate' (UUID: 0x180D), establece conexión GATT
 * y lee en tiempo real el pulso (Heart Rate Measurement Characteristic: 0x2A37).
 *
 * @param onHeartRateUpdate Callback para recibir lecturas de BPM
 * @param onDisconnect Callback cuando el dispositivo se desconecta
 * @returns Objeto con referencia al dispositivo, servidor GATT y función de desconexión
 */
export async function connectHeartRateMonitor(
  onHeartRateUpdate: HeartRateCallback,
  onDisconnect?: () => void
): Promise<BluetoothConnectionResult> {
  const nav = navigator as any;
  
  if (!nav.bluetooth) {
    throw new Error("La API de Web Bluetooth no es compatible con este navegador o requiere entorno HTTPS seguro.");
  }

  try {
    // 1. Escanear y solicitar permiso al usuario para un dispositivo con servicio de ritmo cardíaco (UUID: 0x180D)
    console.log("Buscando dispositivos Bluetooth con servicio 'heart_rate'...");
    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }], // Equivale a 0x180D
      optionalServices: ['battery_service'] // Opcionalmente pedimos acceso a batería
    });

    console.log(`Dispositivo seleccionado: ${device.name || 'Desconocido'}`);

    // Manejar desconexión física o manual
    device.addEventListener('gattserverdisconnected', () => {
      console.warn(`Dispositivo desconectado: ${device.name}`);
      if (onDisconnect) onDisconnect();
    });

    // 2. Establecer conexión GATT
    const server = await device.gatt.connect();
    console.log("Conectado al servidor GATT correctamente.");

    // 3. Obtener el servicio primario 'heart_rate'
    const service = await server.getPrimaryService('heart_rate'); // 0x180D
    console.log("Servicio 'heart_rate' (0x180D) localizado.");

    // 4. Obtener la característica 'heart_rate_measurement' (UUID: 0x2A37)
    const characteristic = await service.getCharacteristic('heart_rate_measurement'); // 0x2A37
    console.log("Característica de lectura (0x2A37) conectada.");

    // 5. Iniciar la suscripción a notificaciones en tiempo real
    await characteristic.startNotifications();
    console.log("Suscripción de notificaciones activada. Esperando datos...");

    // 6. Escuchar los eventos de cambio de valor
    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
      const value: DataView = event.target.value;
      
      // El primer byte contiene los flags de la estructura de datos
      const flags = value.getUint8(0);
      
      // El bit 0 nos indica si el formato de BPM es de 8 bits (0) o de 16 bits (1)
      const is16Bit = (flags & 0x01) === 1;
      
      let bpm: number;
      if (is16Bit) {
        // Formato 16-bit: leemos Uint16 desde el byte 1 (Little Endian)
        bpm = value.getUint16(1, true);
      } else {
        // Formato 8-bit: leemos Uint8 desde el byte 1
        bpm = value.getUint8(1);
      }
      
      // Disparamos el callback con el pulso actualizado
      onHeartRateUpdate(bpm);
    });

    return {
      device,
      server,
      disconnect: () => {
        if (device.gatt && device.gatt.connected) {
          device.gatt.disconnect();
        }
      }
    };
  } catch (error) {
    console.error("Fallo al establecer conexión BLE GATT:", error);
    throw error;
  }
}
