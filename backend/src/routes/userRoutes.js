const express = require("express");
const router = express.Router();

const {
  searchUser,
  updateProfile,
  getMyProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getUserById
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

/* ---------- SPECIFIC ROUTES FIRST ---------- */

router.get("/search", authMiddleware, searchUser);
router.get("/me", authMiddleware, getMyProfile);
router.get("/blocked", authMiddleware, getBlockedUsers);

router.post("/block", authMiddleware, blockUser);
router.post("/unblock", authMiddleware, unblockUser);

router.put(
  "/profile",
  authMiddleware,
  upload.single("profilePic"),
  updateProfile
);

/* ---------- PARAM ROUTE LAST ---------- */

// router.get("/:id", authMiddleware, getUserById);

module.exports = router;
