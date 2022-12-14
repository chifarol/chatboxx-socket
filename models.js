const mongoose = require("mongoose");

require("./connection");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Can't be blank"],
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "Can't be blank"],
  },
  bio: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: [true, "Can't be blank"],
  },
  picture: {
    type: String,
    default:
      "https://res.cloudinary.com/chifarol/image/upload/v1664278102/ChatApp/user/person_FILL1_wght400_GRAD0_opsz48_bdhxq9.png",
  },
  rooms: {
    type: [[]],
    default: [],
  },
  dms: {
    type: [[]],
    default: [],
  },
  blocked: {
    type: [String],
    default: [],
  },
  online: {
    type: Boolean,
    default: false,
  },
});

const model = mongoose.model;
const User = model("User", UserSchema);

module.exports = { model, User };
