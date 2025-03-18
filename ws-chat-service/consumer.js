import { Kafka } from "kafkajs";
import WebSocket, { WebSocketServer } from "ws";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// MongoDB Connection

let cached = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

async function dbConnect() {
  const maxTries = 10;
  let tries = maxTries;

  while (tries > 0) {
    try {
      if (cached.conn) return cached.conn;

      if (!cached.promise) {
        cached.promise = mongoose
          .connect(
            "mongodb+srv://vihanvashishth2712:QMDigESqvC2SiuPX@cluster0.kcbr3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
            { serverSelectionTimeoutMS: 5000 } // Fail fast
          )
          .then((mongoose) => mongoose);
      }

      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      console.error(
        `❌ MongoDB connection failed (${maxTries - tries + 1}/${maxTries}):`,
        error.message
      );
      tries--;
      await new Promise((res) => setTimeout(res, 5000)); // Wait 5s between retries
    }
  }

  throw new Error("🔥 All MongoDB connection attempts failed");
}

// Chat Schema
const ChatSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true },
    text: { type: String, required: true },
    senderId: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { timestamps: true }
);
const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

// Kafka Setup
const kafka = new Kafka({
  clientId: "combined-service",
  brokers: ["kafka:9092"],
});

// WebSocket for Chat Messages
const chatWSS = new WebSocketServer({ port: 8081 });
console.log(`📡 Chat WebSocket server running on port 8081`);

const chatConsumers = {};
chatWSS.on("connection", (ws) => {
  console.log("✅ Chat client connected");

  ws.on("message", async (message) => {
    const data = JSON.parse(message.toString());
    const { conversationId } = data;
    if (!conversationId) return;

    if (!chatConsumers[conversationId]) {
      const consumer = kafka.consumer({
        groupId: `ws-group-${conversationId}`,
      });
      await consumer.connect();
      await consumer.subscribe({ topic: conversationId, fromBeginning: false });

      consumer.run({
        eachMessage: async ({ message }) => {
          const parsedMessage = JSON.parse(message.value?.toString() || "{}");
          console.log(`📩 Broadcasting chat message: ${parsedMessage.message}`);

          chatWSS.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsedMessage));
            }
          });
        },
      });

      chatConsumers[conversationId] = consumer;
    }
  });

  ws.on("close", () => console.log("❌ Chat client disconnected"));
});

// WebSocket for Wishlist Notifications
// const wishlistWSS = new WebSocketServer({ port: 8080 });
// console.log(`📡 Wishlist WebSocket server running on port 8080`);

// const wishlistConsumer = kafka.consumer({ groupId: "wishlist-group" });

// async function startWishlistConsumer() {
//   try {
//     await wishlistConsumer.connect();
//     console.log("✅ Connected to Kafka (Wishlist Consumer)");

//     await wishlistConsumer.subscribe({
//       topic: "wishlist-events",
//       fromBeginning: true,
//     });

//     await wishlistConsumer.run({
//       eachMessage: async ({ message }) => {
//         if (!message.value)
//           return console.warn("⚠️ Empty wishlist message received");

//         try {
//           const event = JSON.parse(message.value.toString());
//           console.log(
//             `📢 Wishlist Event: Product ${event.product._Id} added to wishlist`
//           );

//           wishlistWSS.clients.forEach((client) => {
//             if (client.readyState === WebSocket.OPEN) {
//               client.send(JSON.stringify(event));
//             }
//           });

//           sendNotification(`${event.product.name} added to the wishlist!`);
//         } catch (error) {
//           console.error("❌ Error parsing wishlist message:", error);
//         }
//       },
//     });
//   } catch (error) {
//     console.error("❌ Wishlist Consumer failed to start:", error);
//   }
// }

function sendNotification(message) {
  console.log(`🔔 Notification: ${message}`);
}

// Kafka Consumer for Chat Messages (MongoDB Storage)
const mongoConsumer = kafka.consumer({ groupId: "mongo-group" });

async function startMongoConsumer() {
  await dbConnect();
  await mongoConsumer.connect();
  await mongoConsumer.subscribe({ topic: "chats-mongo", fromBeginning: false });

  await mongoConsumer.run({
    eachMessage: async ({ message }) => {
      try {
        if (!message.value)
          return console.warn("⚠️ Empty chat message received");

        const data = JSON.parse(message.value.toString());
        const { conversationId, text, senderId, timestamp } = data;

        const chat = new Chat({
          conversationId,
          text,
          senderId,
          timestamp,
        });
        await chat.save();
        console.log("💾 Chat saved to MongoDB:", chat);
      } catch (error) {
        console.error("❌ Error saving chat message to MongoDB:", error);
      }
    },
  });
}

// Start all consumers
// startWishlistConsumer();
startMongoConsumer();
