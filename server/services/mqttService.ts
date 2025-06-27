import mqtt from "mqtt";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import { mqttDataSchema } from "@shared/schema";

export class MqttService {
  private client: mqtt.MqttClient | null = null;
  private wss: WebSocketServer | null = null;
  private isConnected = false;
  
  private readonly MQTT_BROKER = process.env.MQTT_BROKER || "mqtt.revolusi-it.com";
  private readonly MQTT_PORT = parseInt(process.env.MQTT_PORT || "1883");
  private readonly MQTT_USER = process.env.MQTT_USER || "usm";
  private readonly MQTT_PASS = process.env.MQTT_PASS || "usmjaya1";
  private readonly MQTT_TOPIC = process.env.MQTT_TOPIC || "iot/G.231.22.0024";
  private readonly DEVICE_ID = "G.231.22.0024";

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      console.log(`Connecting to MQTT broker: ${this.MQTT_BROKER}:${this.MQTT_PORT}`);
      
      this.client = mqtt.connect(`mqtt://${this.MQTT_BROKER}:${this.MQTT_PORT}`, {
        username: this.MQTT_USER,
        password: this.MQTT_PASS,
        clientId: `web_dashboard_${Math.random().toString(16).substr(2, 8)}`,
        keepalive: 60,
        reconnectPeriod: 5000,
        clean: true,
      });

      this.client.on("connect", () => {
        console.log("MQTT connected successfully");
        this.isConnected = true;
        this.client?.subscribe(this.MQTT_TOPIC, (err) => {
          if (err) {
            console.error("Failed to subscribe to topic:", err);
          } else {
            console.log(`Subscribed to topic: ${this.MQTT_TOPIC}`);
          }
        });
        this.broadcastConnectionStatus(true);
      });

      this.client.on("message", async (topic, message) => {
        try {
          const rawData = JSON.parse(message.toString());
          console.log("Received MQTT message:", rawData);
          
          // Validate the data structure
          const validatedData = mqttDataSchema.parse(rawData);
          
          // Store in database
          await storage.createSensorReading({
            deviceId: this.DEVICE_ID,
            dhtTemperature: validatedData.suhuDHT,
            lm35Temperature: validatedData.suhuLM35,
            ledLevel: validatedData.LED,
          });

          // Broadcast to all WebSocket clients
          this.broadcastData({
            type: "sensor_data",
            data: {
              dhtTemperature: validatedData.suhuDHT,
              lm35Temperature: validatedData.suhuLM35,
              ledLevel: validatedData.LED,
              timestamp: new Date().toISOString(),
              deviceId: this.DEVICE_ID,
            },
          });

        } catch (error) {
          console.error("Error processing MQTT message:", error);
        }
      });

      this.client.on("error", (error) => {
        console.error("MQTT connection error:", error);
        this.isConnected = false;
        this.broadcastConnectionStatus(false);
      });

      this.client.on("close", () => {
        console.log("MQTT connection closed");
        this.isConnected = false;
        this.broadcastConnectionStatus(false);
      });

    } catch (error) {
      console.error("Failed to connect to MQTT broker:", error);
      this.isConnected = false;
    }
  }

  setupWebSocketServer(wss: WebSocketServer) {
    this.wss = wss;
    
    wss.on("connection", (ws: WebSocket) => {
      console.log("New WebSocket client connected");
      
      // Send current connection status
      ws.send(JSON.stringify({
        type: "connection_status",
        connected: this.isConnected,
      }));
      
      // Send recent data
      this.sendRecentData(ws);

      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === "get_historical_data") {
            const readings = await storage.getRecentReadings(this.DEVICE_ID, data.limit || 50);
            ws.send(JSON.stringify({
              type: "historical_data",
              data: readings,
            }));
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
      });
    });
  }

  private async sendRecentData(ws: WebSocket) {
    try {
      const recentReadings = await storage.getRecentReadings(this.DEVICE_ID, 20);
      ws.send(JSON.stringify({
        type: "historical_data",
        data: recentReadings,
      }));
    } catch (error) {
      console.error("Error sending recent data:", error);
    }
  }

  private broadcastData(data: any) {
    if (!this.wss) return;
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  private broadcastConnectionStatus(connected: boolean) {
    if (!this.wss) return;
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "connection_status",
          connected,
        }));
      }
    });
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const mqttService = new MqttService();
