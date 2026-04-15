import dns from "dns";
import pkg from "pg";

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pkg;

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

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});
