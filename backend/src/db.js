import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  user: "Dell",
  host: "localhost",
  database: "gharkhoj",
  port: 5432,
});
