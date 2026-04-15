const express = require("express");
const router = express.Router();
const { sendMessageToAI } = require("../controllers/aiController");

router.post("/chat", sendMessageToAI);

module.exports = router;