const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      default: "",
    },

    mediaUrl: {
      type: String,
      default: "",
    },

    mediaType: {
      type: String,
      default: "",
    },

    mediaName: {
      type: String,
      default: "",
    },

    messageType: {
      type: String,
      enum: ["text", "media", "system"],
      default: "text",
    },

   // 👁️ Seen tracking
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

  
    // 🗑 Delete for everyone
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // 👤 Delete only for some users
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
/* ================= INDEX ================= */
groupMessageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);