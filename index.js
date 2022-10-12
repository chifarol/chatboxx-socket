require("./connection");
const { updateDMActivity, updateRoomActivity } = require("./utils");
// for environment variables
require("dotenv").config();
// for logging requests
const morgan = require("morgan");

const { User } = require("./models.js");
const { PORT, FT_HOST } = process.env;

const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FT_HOST,
    methods: ["GET", "POST"],
  },
});
// object for tracking users that are online
let connectUsers = {};
// object for tracking if a user is reading chats with a target user
let currentScreen = {};

io.on("connection", (socket) => {
  socket.on("join_rooms", (data) => {
    data.rooms.forEach((room) => {
      socket.join(room[0]);
    });
  });
  socket.on("error", function (err) {
    if (err.description) console.log(err.description);
    else console.log(err);
  });
  // register user's current screen i.e if he's reading chats with a target user
  socket.on("currentScreen", (data) => {
    currentScreen[data.username] = data.target;
  });
  // emits user's current screen to front end
  socket.on("isTargetReading", ({ username, target }) => {
    if (!currentScreen[username]) {
      socket.emit("targetIsReading", false);
    } else if (currentScreen[target] === username) {
      socket.emit("targetIsReading", true);
    } else {
      socket.emit("targetIsReading", false);
    }
  });
  // checks user is online when frontend emits
  socket.on("online", (data) => {
    connectUsers[data.username] = socket.id;
    socket.username = data.username;
  });
  // emit ->true<-- if user is in connectUsers object
  socket.on("isOnline", (data) => {
    if (connectUsers[data.target]) {
      socket.emit("isOnlineResult", true);
    } else {
      socket.emit("isOnlineResult", false);
    }
  });
  // update user's last seen
  socket.on("lastSeen", async (data) => {
    const { isRoom, targetUsernameOrId, mainUsername } = data;
    let mainUserObj = await User.findOne({ username: mainUsername });
    // if the object in question is not a room
    if (!isRoom) {
      let targetUserObj = await User.findOne({ username: targetUsernameOrId });
      if (mainUserObj && targetUserObj) {
        updateDMActivity(mainUserObj, targetUserObj, false);
      }
    }
    // if the object in question is a room
    else {
      if (mainUserObj) {
        updateRoomActivity(mainUserObj, targetUsernameOrId);
      }
    }
  });
  // remove username from connectUsers when going offline
  socket.on("offline", (data) => {
    delete connectUsers[data.username];
  });
  // broadcst message between two parties (not toom message)
  socket.on("send_message", (data) => {
    const target_username = data.target;
    if (target_username) {
      socket
        .to([connectUsers[target_username], socket.id])
        .emit("receive_message", data.message);
    }
  });
  // broadcst message to all room members
  socket.on("msg_room", (data) => {
    socket.to(data.room_id).emit("receive_room_message", data);
  });
  socket.on("disconnect", (reason) => {
    console.log("disconnect in server", reason);
  });
});

server.listen(PORT, () => {
  console.log("socket IO SERVER IS RUNNING at port - ", PORT);
});
