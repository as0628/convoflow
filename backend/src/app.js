require('dns').setDefaultResultOrder('ipv4first');
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const connectDB = require("./config/db");
const setupSocket = require("./socket/socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require("./routes/chatRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// DB connection
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);

// Health route
app.get("/", (req, res) => {
  res.send("ConvoFlow Backend Running 🚀");
});

// Create HTTP server
const server = http.createServer(app);

// 🔥 PASS APP INTO SOCKET
setupSocket(server, app);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});