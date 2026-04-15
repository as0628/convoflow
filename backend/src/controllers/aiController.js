const { GoogleGenAI } = require("@google/genai");
const Message = require("../models/Message");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.sendMessageToAI = async (req, res) => {
  try {
    const { senderId, message } = req.body;
    const aiUserId = process.env.AI_USER_ID;

    if (!senderId || !message) {
      return res.status(400).json({ message: "senderId and message required" });
    }

    // Save user message
    const userMessage = await Message.create({
      sender: senderId,
      receiver: aiUserId,
      content: message,
      messageType: "text",
    });

    // 🔥 Use gemini-pro (legacy supported model)
    const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: message,
});

    const aiReplyText = response.text;

    // Save AI reply
    const aiMessage = await Message.create({
      sender: aiUserId,
      receiver: senderId,
      content: aiReplyText,
      messageType: "text",
    });

    res.status(200).json({
      userMessage,
      aiMessage,
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI failed" });
  }
};