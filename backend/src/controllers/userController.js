const User = require("../models/User");

// 🔍 SEARCH USERS
exports.searchUser = async (req, res) => {
  try {
    const keyword = req.query.search;
    const loggedInUserId = req.user.id;

    if (!keyword) return res.json([]);

    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { username: keyword.toLowerCase() }, // exact match
        { email: keyword.toLowerCase() },
        { phone: keyword },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ FIXED

    const { name, bio } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;

    if (req.file) {
      updateData.profilePic = req.file.path; // ✅ Cloudinary URL
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 🚫 BLOCK USER
// 🚫 BLOCK USER
exports.blockUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const { userIdToBlock } = req.body;

    if (!userIdToBlock) {
      return res.status(400).json({
        message: "User required",
      });
    }

    // 🔥 Find target user
    const targetUser = await User.findById(userIdToBlock);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 🤖 Prevent blocking AI
    if (
      targetUser._id.toString() === process.env.AI_USER_ID
    ) {
      return res.status(400).json({
        message: "AI Assistant cannot be blocked",
      });
    }

    await User.findByIdAndUpdate(myId, {
      $addToSet: { blockedUsers: userIdToBlock },
    });

    res.json({
      message: "User blocked successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ✅ UNBLOCK USER
exports.unblockUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const { userIdToUnblock } = req.body;

    await User.findByIdAndUpdate(myId, {
      $pull: { blockedUsers: userIdToUnblock },
    });

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📋 GET BLOCKED USERS
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("blockedUsers", "name profilePic phone bio");

    res.json(user.blockedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
