// server/src/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

//connect to MongoDB 
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err.message));

// health check - show status as okay if connected to MongoDB
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// 3) API routes using the Message model
const Message = require("./models/Message");

// GET all messages
app.get("/api/messages", async (_req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST a new message
app.post("/api/messages", async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    const text = (req.body.text || "").trim();
    const imageUrl = (req.body.imageUrl || "").trim();
    if (!title)
    {
        return res.status(400).json({ error: "please fill out title field." }); 
    }
    else if (!text || !imageUrl)
    {
         return res.status(400).json({ error: "please add description and or image." }); 
    } 

    const msg = await Message.create({ title, text, imageUrl });
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a message 
app.delete("/api/messages/:id", async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

// 4) serve the built React app in production
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));

// Express 5-safe SPA fallback (no path pattern)
app.use((req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
