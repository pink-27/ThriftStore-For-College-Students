import { Kafka } from "kafkajs";
import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const kafka = new Kafka({
  clientId: "wishlist-notifier",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "wishlist-group" });

export async function startConsumer() {
  try {
    await consumer.connect();
    console.log("✅ Connected to Kafka as a consumer");

    await consumer.subscribe({ topic: "wishlist-events", fromBeginning: true });
    console.log("✅ Subscribed to topic: wishlist-events");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          `📥 Received message from ${topic}, partition ${partition}`
        );

        if (!message.value) {
          console.warn("⚠️ Empty message received");
          return;
        }

        try {
          const event = JSON.parse(message.value.toString());
          // console.log(event);
          console.log(
            `📢 Wishlist Event: Product ${event.product._Id} added to the wishlist`
          );
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(event));
            }
          });
          sendNotification(`${event.product.name} added to the wishlist!`);
        } catch (error) {
          console.error("❌ Error parsing message:", error);
        }
      },
    });
  } catch (error) {
    console.error("❌ Consumer failed to start:", error);
  }
}

function sendNotification(message) {
  console.log(`🔔 Notification: ${message}`);
}

startConsumer();
