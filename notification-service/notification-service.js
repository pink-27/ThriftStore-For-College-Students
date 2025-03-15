import { Kafka } from "kafkajs";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

// Kafka Setup
const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["kafka:9092"],
});

const notificationConsumer = kafka.consumer({ groupId: "notifications-group" });

// WebSocket Server for Notifications
const notificationWSS = new WebSocketServer({ port: 8080 });
console.log(`📡 Notification WebSocket server running on port 8080`);

async function startNotificationConsumer() {
  try {
    await notificationConsumer.connect();
    console.log("✅ Connected to Kafka (Notification Consumer)");

    await notificationConsumer.subscribe({
      topic: "wishlist-events",
      fromBeginning: false,
    });
    await notificationConsumer.subscribe({
      topic: "order-events",
      fromBeginning: false,
    });

    await notificationConsumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value)
          return console.warn(`⚠️ Empty message received on topic ${topic}`);

        try {
          const event = JSON.parse(message.value.toString());

          let notificationMessage = "";
          if (topic === "wishlist-events") {
            notificationMessage = `🛍️ ${event.product.name} added to the wishlist!`;
            console.log(`📢 Wishlist Event: ${notificationMessage}`);
          } else if (topic === "order-events") {
            notificationMessage = `📦 Order placed for Product ID: ${event.productId}`;
            console.log(`📢 Order Event: ${notificationMessage}`);
          }

          // Send notification to all connected WebSocket clients
          notificationWSS.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ message: notificationMessage }));
            }
          });

          sendNotification(notificationMessage);
        } catch (error) {
          console.error(`❌ Error parsing message from topic ${topic}:`, error);
        }
      },
    });
  } catch (error) {
    console.error("❌ Notification Consumer failed to start:", error);
  }
}

// Function to Log Notifications (Can be extended for Email/SMS)
function sendNotification(message) {
  console.log(`🔔 Notification: ${message}`);
}

// Start the Notification Service
startNotificationConsumer();
