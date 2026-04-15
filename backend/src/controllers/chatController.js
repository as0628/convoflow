const Chat = require("../models/Chat");

exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  const loggedInUserId = req.user.id; // 🔴 FIXED HERE

  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [loggedInUserId, userId] },
  }).populate("users", "-password");

  if (chat) {
    return res.json(chat);
  }

  const newChat = await Chat.create({
    users: [loggedInUserId, userId], // 🔴 NOW BOTH ARE VALID IDS
  });

  const fullChat = await Chat.findById(newChat._id).populate(
    "users",
    "-password"
  );

  res.status(201).json(fullChat);
};

// exports.getChats = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const chats = await Chat.find({
//       users: { $in: [userId] },
//     })
//       .populate("users", "name profilePic isOnline lastSeen")
//       .populate("latestMessage") // ✅ ADD THIS
//       .sort({ updatedAt: -1 });

//     res.json(chats);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    let chats = await Chat.find({
      users: { $in: [userId] },
    })
      .populate("users", "name profilePic isOnline lastSeen username email phone")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name profilePic",
        },
      })
      .sort({ updatedAt: -1 });

    // 🔥 REMOVE CLEARED CHATS (IMPORTANT)
    chats = chats.filter((chat) => {
      const cleared = chat.clearedBy.find(
        (c) => c.user.toString() === userId
      );

      if (!cleared) return true;

      return (
        chat.latestMessage &&
        new Date(chat.latestMessage.createdAt) >
          new Date(cleared.clearedAt)
      );
    });

    // 🔥 SPLIT LOGIC
    const unreadChats = [];
    const recentChats = [];

    chats.forEach((chat) => {
      const unread = chat.unreadCount?.get(userId) || 0;

      if (unread > 0) {
        unreadChats.push(chat);
      } else {
        recentChats.push(chat);
      }
    });

    // 🔥 FINAL ORDER (UNREAD FIRST)
    const finalChats = [...unreadChats, ...recentChats];

    res.json(finalChats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await Chat.findByIdAndUpdate(chatId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    res.json({ message: "Chat marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};