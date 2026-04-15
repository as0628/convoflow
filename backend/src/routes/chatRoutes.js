const express = require("express");
const router = express.Router();
const { accessChat ,getChats, markChatAsRead} = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, accessChat);
router.get("/", authMiddleware, getChats);
router.put("/read/:chatId", authMiddleware, markChatAsRead);

module.exports = router;
