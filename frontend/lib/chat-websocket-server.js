// services/ws-server.ts
import { Kafka } from "kafkajs";
import WebSocket, { WebSocketServer } from "ws";

const kafka = new Kafka({
  clientId: "chat-ws",
  brokers: ["localhost:9092"],
});

const wss = new WebSocketServer({ port: 8081 });
console.log(`WebSocket server running on port 8081`);

const consumers = {};

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  ws.on("message", async (message) => {
    const data = JSON.parse(message.toString());
    const { conversationId } = data;
    if (!conversationId) return;

    if (!consumers[conversationId]) {
      const consumer = kafka.consumer({
        groupId: `ws-group-${conversationId}`,
      });
      await consumer.connect();
      await consumer.subscribe({ topic: conversationId, fromBeginning: false });

      consumer.run({
        eachMessage: async ({ message }) => {
          const parsedMessage = JSON.parse(message.value?.toString() || "{}");
          console.log(`Broadcasting message: ${parsedMessage.message}`);

          // Broadcast message to all WebSocket clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsedMessage));
            }
          });
        },
      });

      consumers[conversationId] = consumer;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
