import mongoose from 'mongoose';
import dns from 'dns';

// Override DNS behavior for Node.js environments
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore fallback on older node versions
}

try {
  // Use public DNS to resolve MongoDB Atlas SRV records if local DNS fails
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if proxy or corporate firewall blocks custom servers
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
