const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

     username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscore"],
    },

    phone: {
  type: String,
  required: true,
  unique: true,
  trim: true,
  match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
},

    email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "Please use a valid email address",
  ],
},
    password: {
      type: String,
      required: true,
    },
    otp: {
  type: String,
},
otpExpires: {
  type: Date,
},
isVerified: {
  type: Boolean,
  default: false,
},

    isOnline: {
      type: Boolean,
      default: false,
    },

    profilePic: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    isBot: {
  type: Boolean,
  default: false
},
    blockedUsers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
