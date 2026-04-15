import dns from "dns";
import pkg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pkg;

// Log to confirm the variable is being read
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "found ✅" : "missing ❌",
);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
