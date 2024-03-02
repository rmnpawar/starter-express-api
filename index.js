const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.get("/", (req, res) => {
  res.send("hello world");
});

const server = app.listen(3000, () => {
  console.log("server running on localhost:3000");
});

const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let rooms = {};
let socketToRoom = {};

io.on("connection", (socket) => {
  socket.on('connect', () => {
    console.log('Hello, successfully connected to the signalling server!');
    alert();
  });

  socket.on("join", (data) => {
    const roomId = data.room;
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;

    if (rooms[roomId]) {
      rooms[roomId].push({ id: socket.id, name: data.name });
    } else {
      rooms[roomId] = [{ id: socket.id, name: data.name }];
    }

    const users = rooms[data.room].filter((user) => user.id !== socket.id);
    io.sockets.to(socket.id).emit("room_users", users);
    console.log("[joined] room: " + data.room + " name: " + data.name);
  });

  socket.on("offer", (sdp) => {
    socket.broadcast.emit("getOffer", sdp);
    console.log("offer: " + socket.id);
  });

  socket.on("answer", (sdp) => {
    socket.broadcast.emit("getAnswer", sdp);
    console.log("answer: " + socket.id);
  });

  socket.on("candidate", (candidate) => {
    socket.broadcast.emit("getCandidate", candidate);
    console.log("candidate: " + socket.id);
  });

  socket.on("room_users", (data) => {
    console.log("join: " + data);
  })

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    let room = rooms[roomId];
    if (room) {
      room = room.filter((user) => user.id !== socket.id);
      rooms[roomId] = room;
    }
    socket.broadcast.to(room).emit("user_exit", { id: socket.id });
    console.log(`[${socketToRoom[socket.id]}]: ${socket.id} exit`);
  });
});
