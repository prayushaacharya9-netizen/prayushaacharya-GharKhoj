import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { pool } from "./db.js";
import admin from "./firebase.js";
import { supabase } from "./supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  async function sendPushNotification(tokens, title, body, data = {}) {
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  }

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  app.get("/", (req, res) => {
    res.send("Backend is running");
  });

  app.post("/brokers/register", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Invalid authorization header" });
      }
      const decoded = await admin.auth().verifyIdToken(token);
      const firebaseUid = decoded.uid;
      const email = decoded.email;
      const name = req.body.name ?? null;
      const NotificationToken = req.body.token ?? null;

      const result = await pool.query(
        `
        INSERT INTO brokers (id, name, email, token)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
        RETURNING *
        `,
        [firebaseUid, name, email, NotificationToken],
      );

      if (result.rows.length === 0) {
        console.log("Broker already exists, no row inserted");
        return res.status(200).json({ message: "Broker already registered" });
      }

      console.log("Inserted broker row:", result.rows[0]);
      res.status(201).json({ broker: result.rows[0] });
    } catch (error) {
      console.error("Error in /brokers/register:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/users/register", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Invalid authorization header" });
      }
      const decoded = await admin.auth().verifyIdToken(token);
      const firebaseUid = decoded.uid;
      const email = decoded.email;
      const name = req.body.name ?? null;
      const NotificationToken = req.body.token ?? null;
      console.log("NotificationToken:", NotificationToken);

      const result = await pool.query(
        `
        INSERT INTO users (id, name, email, token)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
        RETURNING *
        `,
        [firebaseUid, name, email, NotificationToken],
      );

      if (result.rows.length === 0) {
        console.log("User already exists, no row inserted");
        return res.status(200).json({ message: "User already registered" });
      }

      console.log("Inserted User row:", result.rows[0]);
      res.status(201).json({ broker: result.rows[0] });
    } catch (error) {
      console.error("Error in /users/register:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/listing", async (req, res) => {
    console.log("Received body:", req.body);
    console.log("Authorization header:", req.headers.authorization);
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(token);

      const brokerId = decoded.uid;
      const {
        title,
        description,
        location,
        rent,
        bed,
        bath,
        latitude,
        longitude,
      } = req.body;

      if (!title || !location || !rent) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await pool.query(
        `
        INSERT INTO listings (broker_id, title, description, location, rent, beds, baths, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          brokerId,
          title,
          description,
          location,
          rent,
          bed,
          bath,
          latitude,
          longitude,
        ],
      );

      const users = await pool.query(`
        SELECT token 
        FROM users
        WHERE token IS NOT NULL
      `);

      const tokens = users.rows.map((u) => u.token);

      if (tokens.length > 0) {
        await sendPushNotification(
          tokens,
          "New Listing Available",
          `${title} has been added`,
        );
      }
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Create listing error:", err);
      console.log(err);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.post("/conversations", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(token);

      const user_uid = decoded.uid;

      const { broker_uid, listing_id } = req.body;

      if (!broker_uid || !listing_id) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const result = await pool.query(
        `
        INSERT INTO conversations (user_uid, broker_uid, listing_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_uid, broker_uid, listing_id)
        DO UPDATE SET created_at = CURRENT_TIMESTAMP
        RETURNING *;
        `,
        [user_uid, broker_uid, listing_id],
      );

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("Conversation creation error:", err);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/messages", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(token);

      const sender_uid = decoded.uid;
      const { conversation_id, text } = req.body;

      if (!conversation_id || !text) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const result = await pool.query(
        `
        INSERT INTO messages (conversation_id, sender_uid, text)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
        [conversation_id, sender_uid, text],
      );

      const interaction = await pool.query(
        `
        SELECT *
        FROM conversations
        WHERE id = $1
      `,
        [conversation_id],
      );
      let target_token;
      let target_name;
      const target_user = req.body.is_broker
        ? interaction.rows[0].user_uid
        : interaction.rows[0].broker_uid;
      if (req.body.is_broker) {
        target_token = await pool.query(
          `
          SELECT token
          FROM users
          WHERE id = $1
        `,
          [target_user],
        );
        target_name = await pool.query(
          `
          SELECT name
          FROM brokers
          WHERE id = $1
        `,
          [sender_uid],
        );
      } else {
        target_token = await pool.query(
          `
        SELECT token
        FROM brokers
        WHERE id = $1
      `,
          [target_user],
        );
        target_name = await pool.query(
          `
          SELECT name
          FROM users
          WHERE id = $1
        `,
          [sender_uid],
        );
      }
      const target_user_token = target_token?.rows[0]?.token;
      console.log("target_user_token:", target_user_token);
      await sendPushNotification(
        [target_user_token],
        "New Message",
        `${target_name?.rows[0]?.name} sent you a message`,
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/conversations/user/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const result = await pool.query(
        `
        SELECT *
        FROM conversations
        WHERE user_uid = $1
      `,
        [uid],
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Fetch conversations error:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/conversations/broker/:bid", async (req, res) => {
    try {
      const { bid } = req.params;

      const result = await pool.query(
        `
        SELECT *
        FROM conversations
        WHERE broker_uid = $1
      `,
        [bid],
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Fetch conversations error:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;

      const result = await pool.query(
        `
        SELECT *
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC;
        `,
        [conversationId],
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Fetch messages error:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  const uploadMemory = multer({ storage: multer.memoryStorage() });
  app.post(
    "/upload-multiple",
    uploadMemory.array("photos", 5),
    async (req, res) => {
      try {
        const { listingId } = req.body;

        if (!listingId)
          return res.status(400).json({ error: "listingId is required" });
        if (!req.files || req.files.length === 0)
          return res.status(400).json({ error: "No files uploaded" });

        const uploadedUrls = [];

        for (const file of req.files) {
          const fileName = `listings/${listingId}/${Date.now()}-${file.originalname}`;

          const { error } = await supabase.storage
            .from("listing-images")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (error) throw error;

          const { data } = supabase.storage
            .from("listing-images")
            .getPublicUrl(fileName);

          uploadedUrls.push(data.publicUrl);

          await pool.query(
            `INSERT INTO listing_images (listing_id, image_url) VALUES ($1, $2)`,
            [listingId, data.publicUrl],
          );
        }

        res.status(201).json({
          message: "Images uploaded successfully",
          images: uploadedUrls,
        });
      } catch (err) {
        console.error("Image upload error:", err);
        res.status(500).json({ error: "Image upload failed" });
      }
    },
  );

  app.get("/listings", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          l.id,
          l.broker_id,
          l.title,
          l.description,
          l.location,
          l.rent,
          l.beds,
          l.baths,
          l.latitude,
          l.longitude,
          l.created_at,
          COALESCE(
            array_agg(li.image_url) FILTER (WHERE li.image_url IS NOT NULL),
            '{}'
          ) AS images
        FROM listings l
        LEFT JOIN listing_images li ON li.listing_id = l.id
        GROUP BY l.id
        ORDER BY l.created_at DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error("Fetch listings error:", err);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.get("/brokers/register", async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM brokers`);
      res.json(result.rows);
    } catch (err) {
      console.error("Fetch brokers error:", err);
      res.status(500).json({ error: "Failed to fetch brokers" });
    }
  });

  app.get("/users/register", async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM users`);
      res.json(result.rows);
    } catch (err) {
      console.error("Fetch users error:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
});
