const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createGroup,
  getMyGroups,
  sendGroupMessage,
  getGroupMessages,
  addMember,
  removeMember,
  leaveGroup,
  updateGroupPic,
  makeAdmin,
  removeAdmin,
  getAvailableUsers,
  updateGroupName,
  markGroupMessagesSeen,
  deleteGroupMessage,clearGroupChat,markGroupAsRead,
} = require("../controllers/groupController");

/* ================= GROUP BASIC ================= */
router.post("/update-name", auth, updateGroupName);
router.post("/", auth, createGroup);
router.get("/", auth, getMyGroups);
router.put("/group/clear/:groupId", auth, clearGroupChat);

/* ================= MESSAGES ================= */

router.post(
  "/message",
  auth,
  upload.single("file"),
  sendGroupMessage
);

router.get(
  "/messages/:groupId",
  auth,
  getGroupMessages
);

/* ================= GROUP PROFILE PIC ================= */

router.put(
  "/update-pic",
  auth,
  upload.single("file"),
  updateGroupPic
);

/* ================= MEMBER MANAGEMENT ================= */

router.post("/add-member", auth, addMember);
router.post("/remove-member", auth, removeMember);

/* ================= ADMIN MANAGEMENT ================= */

router.post("/make-admin", auth, makeAdmin);
router.post("/remove-admin", auth, removeAdmin);

/* ================= LEAVE ================= */
router.get("/available-users/:groupId", auth, getAvailableUsers);
router.post("/leave", auth, leaveGroup);
router.put("/group/seen", auth, markGroupMessagesSeen);
router.put("/group/delete", auth, deleteGroupMessage);
router.put("/read/:groupId", auth, markGroupAsRead);

module.exports = router;