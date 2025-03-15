import mongoose from "mongoose";
const MONGODB_URI = process.env.DATABASE_URL as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global caching to prevent re-connection in Next.js hot-reloading
declare global {
  var mongooseCache: MongooseCache;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {})
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  console.log("🛠️ Registered Models:", mongoose.modelNames()); // ✅ Debug log

  return cached.conn;
}

export default dbConnect;
