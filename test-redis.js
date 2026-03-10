import 'dotenv/config';
import Redis from 'ioredis';

// Use the full URL from your Upstash console (ensure it has the password!)
const redis = new Redis(process.env.REDIS_URL);

async function testConnection() {
  try {
    console.log("Checking connection to Upstash...");
    
    // Set a test key
    await redis.set("test_connection", "Success! Upstash is working.");
    
    // Retrieve the test key
    const result = await redis.get("test_connection");
    
    console.log("------------------------------------");
    console.log("Status:", result);
    console.log("------------------------------------");
    
    // Clean up
    await redis.del("test_connection");
    process.exit(0);
  } catch (error) {
    console.error("Connection Failed!");
    console.error("Error Detail:", error.message);
    process.exit(1);
  }
}

testConnection();