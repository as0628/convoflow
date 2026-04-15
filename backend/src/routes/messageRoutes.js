const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  markAsSeen,
  markMessageSeen,
  deleteMessage,
  clearChat,
  deleteChat,
} = require("../controllers/messageController");

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// 📜 Get chat messages
router.get("/:chatId", auth, getMessages);

// 🧹 Clear chat (only for user)
router.put("/clear/:chatId", auth, clearChat);

// ❌ Delete chat (remove from sidebar)
router.delete("/:chatId", auth, deleteChat);

// 👁 Mark entire chat messages as seen
router.put("/seen/chat", auth, markAsSeen);

// 👁 Mark single message as seen
router.put("/seen/message", auth, markMessageSeen);

// 🗑 Delete message
router.put("/delete", auth, deleteMessage);

// 📩 Send message (text or media)
router.post("/", auth, upload.single("file"), sendMessage);

module.exports = router;

// const express = require("express");
// const router = express.Router();

// const {
//   sendMessage,
//   getMessages,
//   markAsSeen,
//   markMessageSeen,
//   deleteMessage,clearChat,
// } = require("../controllers/messageController");

// const auth = require("../middleware/authMiddleware");
// const upload = require("../middleware/upload");

// // 📜 Get chat messages
// router.get("/:chatId", auth, getMessages);
// router.put("/chat/clear/:chatId", auth, clearChat);
// // 👁 Mark entire chat messages as seen
// router.put("/seen/chat", auth, markAsSeen);

// // 👁 Mark single message as seen
// router.put("/seen/message", auth, markMessageSeen);

// // 🗑 Delete message
// router.put("/delete", auth, deleteMessage);

// // 📩 Send message (text or media)
// router.post(
//   "/",
//   auth,
//   upload.single("file"),
//   sendMessage
// );

// module.exports = router;