import { Kafka } from "kafkajs";
import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://vihanvashishth2712:QMDigESqvC2SiuPX@cluster0.kcbr3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Global caching to prevent re-connection in hot-reloading environments
let cached = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {})
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

const kafka = new Kafka({
  clientId: "mongo-reciver",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "mongo-group" });
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
const run = async () => {
  await dbConnect();
  await consumer.connect();
  await consumer.subscribe({ topic: "chats-mongo", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log(
          `📥 Received message from ${topic}, partition ${partition}`
        );
        // if (!conversationId || !msg || !senderId || !timestamp)
        //   throw new Error();
        const data = await JSON.parse(message.value.toString());
        const { conversationId, msg, senderId, timestamp } = data;
        const chat = new Chat({
          conversationId,
          text: msg,
          senderId,
          timestamp,
        });

        await chat.save();
        console.log("📤 Message saved to MongoDB", chat);
      } catch (error) {
        console.error("Error saving message to MongoDB:", error);
      }
    },
  });
};

run().catch(console.error);
