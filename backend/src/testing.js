import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});


(async () => {
    const result = await pool.query('SELECT current_database(), current_schema();');
    console.log(result.rows); // should show gharkhoj
  })();

