const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");


// ==============================
// 📩 SEND MESSAGE (TEXT / MEDIA)
// ==============================
exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;
    const senderId = req.user.id;

    if (!content && !req.file) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const chat = await Chat.findById(chatId).populate("users");
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const receiver = chat.users.find(
      (u) => u._id.toString() !== senderId
    );

    if (!receiver) {
      return res.status(400).json({ message: "Invalid chat" });
    }

    const sender = await User.findById(senderId);
    const receiverUser = await User.findById(receiver._id);

    if (
      sender.blockedUsers.some(
        (id) => id.toString() === receiver._id.toString()
      )
    ) {
      return res.status(403).json({
        message: "You have blocked this user",
      });
    }

    if (
      receiverUser.blockedUsers.some(
        (id) => id.toString() === senderId.toString()
      )
    ) {
      return res.status(403).json({
        message: "You are blocked by this user",
      });
    }

    // ====================
    // ✅ CREATE USER MESSAGE
    // ====================
    const messageData = {
      sender: senderId,
      chat: chatId,
      content: content || "",
      status: "sent",
    };

    if (req.file) {
      messageData.mediaUrl = req.file.path; // Cloudinary URL
      messageData.mediaType = req.file.mimetype;
      messageData.mediaName = req.file.originalname;
    }

    let message = await Message.create(messageData);
    // 🔥 UPDATE CHAT FOR SIDEBAR
await Chat.findByIdAndUpdate(chatId, {
  latestMessage: message._id,
  updatedAt: Date.now(),
   $inc: { [`unreadCount.${receiver._id}`]: 1 },
});

    message = await Message.findById(message._id)
  .populate("sender", "name profilePic")
  .populate({
    path: "chat",
    populate: {
      path: "users",
      select: "name profilePic",
    },
  });

    res.status(201).json(message);

    // ===================================
    // 🤖 AI AUTO REPLY
    // ===================================

    const AI_USER_ID = process.env.AI_USER_ID;

    const isAIChat = chat.users.some(
      (user) => user._id.toString() === AI_USER_ID
    );

    if (!isAIChat) return;

    setTimeout(async () => {
      try {
        const { GoogleGenAI } = require("@google/genai");

        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        // 🧠 Build conversation memory
        const previousMessages = await Message.find({ chat: chatId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("sender");

        let conversationText =
          "You are a friendly AI assistant inside a chat app. Keep replies short and natural.\n\n";

        previousMessages.reverse().forEach((msg) => {
          if (msg.sender._id.toString() === AI_USER_ID) {
            conversationText += `AI: ${msg.content}\n`;
          } else {
            conversationText += `User: ${msg.content}\n`;
          }
        });

        let aiReply = "AI temporarily unavailable.";

        try {
          const contents = [];

          // Always add text
          contents.push({
            role: "user",
            parts: [{ text: conversationText }],
          });

          // 🖼️ If IMAGE uploaded
          if (
            message.mediaUrl &&
            message.mediaType &&
            message.mediaType.startsWith("image/")
          ) {
            contents.push({
              role: "user",
              parts: [
                {
                  fileData: {
                    mimeType: message.mediaType,
                    fileUri: message.mediaUrl,
                  },
                },
              ],
            });
          }

          // 📄 If PDF uploaded
          if (
            message.mediaUrl &&
            message.mediaType === "application/pdf"
          ) {
            contents.push({
              role: "user",
              parts: [
                {
                  text: `User uploaded a PDF file: ${message.mediaUrl}. 
Please summarize or explain its content if accessible.`,
                },
              ],
            });
          }

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: contents,
          });

          aiReply = response.text;

          console.log("✅ GEMINI SUCCESS");
        } catch (err) {
          console.error("🔥 GEMINI ERROR:", err.message);
        }

        // ✅ Save AI reply
        // ✅ Save AI reply
const aiMessage = await Message.create({
  sender: AI_USER_ID,
  chat: chatId,
  content: aiReply,
  status: "sent",
});

// 🔥 UPDATE CHAT AFTER MESSAGE CREATED
await Chat.findByIdAndUpdate(chatId, {
  latestMessage: aiMessage._id,
  updatedAt: Date.now(),
});

        const populatedAIMessage = await Message.findById(
  aiMessage._id
)
  .populate("sender", "name profilePic")
  .populate({
    path: "chat",
    populate: {
      path: "users",
      select: "name profilePic",
    },
  });

        // 🔥 Live emit
        const wss = req.app.get("wss");

        if (wss && wss.rooms) {
          const roomId = `chat-${chatId}`;
          const room = wss.rooms.get(roomId);

          if (!room) return;

          room.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "message",
                  chatId: chatId,
                  message: populatedAIMessage,
                })
              );
            }
          });
        }
      } catch (error) {
        console.error("AI Reply Error:", error);
      }
    }, 1500);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==============================
// 📜 GET CHAT HISTORY
// ==============================
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    let clearData = null;

    if (chat && chat.clearedBy) {
      clearData = chat.clearedBy.find(
        (entry) => entry.user.toString() === userId
      );
    }

    let filter = {
      chat: chatId,
      deletedFor: { $ne: userId },
      deletedForEveryone: false,
    };

    // 🔥 CLEAR CHAT LOGIC
    if (clearData) {
      filter.createdAt = { $gt: clearData.clearedAt };
    }

    let messages = await Message.find(filter)
      .populate("sender", "name profilePic")
      .populate("chat")
      .sort({ createdAt: 1 });

    // optional (if you want "This message was deleted")
    messages = messages.map((msg) => {
      if (msg.deletedForEveryone) {
        msg.content = "This message was deleted";
        msg.mediaUrl = "";
      }
      return msg;
    });

    res.status(200).json(messages);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ==============================
// 👁️ MARK AS SEEN
// ==============================
exports.markAsSeen = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user.id;

    const messagesToUpdate = await Message.find({
      chat: chatId,
      sender: { $ne: userId },
      status: { $ne: "seen" },
    });

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        status: { $ne: "seen" },
      },
      { status: "seen" }
    );

    const wss = req.app.get("wss");

    if (wss && wss.rooms) {
      const roomId = `chat-${chatId}`;
      const room = wss.rooms.get(roomId);

      if (room) {
        messagesToUpdate.forEach((msg) => {
          room.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "status-update",
                  messageId: msg._id,
                  status: "seen",
                })
              );
            }
          });
        });
      }
    }

    res.json({ message: "Messages marked as seen" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markMessageSeen = async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // avoid duplicate seen
    if (!message.seenBy.includes(userId)) {
      message.seenBy.push(userId);
      message.status = "seen";
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑 DELETE MESSAGE
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId, deleteType } = req.body; // ✅ added
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    let finalDeleteType = deleteType || "me";

    // 🔥 DELETE FOR EVERYONE
    if (finalDeleteType === "everyone") {
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ message: "Not allowed" });
      }

      message.deletedForEveryone = true;
      message.content = "";
      message.mediaUrl = "";
    } else {
      // 🔥 DELETE FOR ME
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();

    // 🔥 SOCKET EMIT
    const wss = req.app.get("wss");

    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "message-deleted",
              messageId: message._id,
              deleteType: finalDeleteType,
              userId,
            })
          );
        }
      });
    }

    res.json({
      message: "Message deleted",
      deleteType: finalDeleteType,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // remove old clear entry
    chat.clearedBy = chat.clearedBy.filter(
      (entry) => entry.user.toString() !== userId
    );

    // add new clear time
    chat.clearedBy.push({
      user: userId,
      clearedAt: new Date(),
    });

    await chat.save();

    res.json({ message: "Chat cleared" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // 🔥 Remove user from chat
    chat.users = chat.users.filter(
      (u) => u.toString() !== userId
    );

    await chat.save();

    res.json({ message: "Chat deleted (removed from your list)" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};