const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const uploadRoute = require("./routes/upload");
const authRoutes = require("./routes/auth");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173" || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Store connected users and messages
const users = {};
const messages = [];
const typingUsers = {};

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on("user_join", (username) => {
    users[socket.id] = { username, id: socket.id };
    io.emit("user_list", Object.values(users));
    io.emit("user_joined", { username, id: socket.id });
    console.log(`${username} joined the chat`);
  });

  // Handle chat messages
  socket.on("send_message", (messageData) => {
    const message = {
      ...messageData,
      id: Date.now(),
      sender: users[socket.id]?.username || "Anonymous",
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);

    // Limit stored messages to prevent memory issues
    if (messages.length > 100) {
      messages.shift();
    }

    io.emit("receive_message", message);
  });

  // Handle typing indicator
  socket.on("typing", (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;

      if (isTyping) {
        typingUsers[socket.id] = username;
      } else {
        delete typingUsers[socket.id];
      }

      io.emit("typing_users", Object.values(typingUsers));
    }
  });

  // Handle private messages
  socket.on("private_message", ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || "Anonymous",
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };

    socket.to(to).emit("private_message", messageData);
    socket.emit("private_message", messageData);
  });

  socket.on("message_delivered", ({ messageId }) => {
    // Broadcast to sender
    io.to(senderSocketId).emit("message_status_update", {
      messageId,
      status: "delivered",
    });
  });

  socket.on("message_read", ({ messageId }) => {
    io.to(senderSocketId).emit("message_status_update", {
      messageId,
      status: "read",
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit("user_left", { username, id: socket.id });
      console.log(`${username} left the chat`);
    }

    delete users[socket.id];
    delete typingUsers[socket.id];

    io.emit("user_list", Object.values(users));
    io.emit("typing_users", Object.values(typingUsers));
  });
});

// API routes
app.use("/api/upload", uploadRoute);
app.use("/api/auth", authRoutes);

// Endpoint to get chat messages
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

app.get("/api/users", (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get("/", (req, res) => {
  res.send("Socket.io Chat Server is running");
});

// Start server
const PORT = process.env.PORT || 5000;
// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

module.exports = { app, server, io };
