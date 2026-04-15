import dns from "dns";
import dotenv from "dotenv";
import pkg from "pg";

// Force IPv4 DNS resolution globally
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
