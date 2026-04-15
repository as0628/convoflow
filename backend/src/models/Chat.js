const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },

    isGroupChat: {
      type: Boolean,
      default: false,
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCount: {
  type: Map,
  of: Number,
  default: {}
},

    // 🔥 IMPORTANT: for "Clear Chat per user"
    clearedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        clearedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// 🔥 Optimize queries (VERY IMPORTANT for sidebar)
chatSchema.index({ users: 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);