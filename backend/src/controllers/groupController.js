const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/User"); // ✅ ADD THIS
/* ================= CREATE GROUP ================= */

exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name || !members || members.length < 1) {
      return res.status(400).json({
        message: "Group name and at least 1 member required",
      });
    }

    const allMembers = [...new Set([...members, req.user.id])];

    const group = await Group.create({
      name,
      description,
      members: allMembers,
      admins: [req.user.id], // creator is admin
      createdBy: req.user.id,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "name profilePic")
      .populate("admins", "name");

    res.status(201).json(populatedGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE GROUP PROFILE PIC ================= */

exports.updateGroupPic = async (req, res) => {
  try {
    const { groupId } = req.body;

   const group = await Group.findById(groupId);

if (!group) {
  return res.status(404).json({ message: "Group not found" });
}
    // Only members can change
    if (!group.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not a group member" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    group.groupPic = req.file.path;
    await group.save();

    res.json({ message: "Group picture updated", groupPic: group.groupPic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= MAKE ADMIN ================= */

exports.makeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.admins.some(a => a.toString() === req.user.id)) {
      return res.status(403).json({ message: "Only admin can promote" });
    }

    if (group.admins.length >= 4) {
      return res.status(400).json({ message: "Max 4 admins allowed" });
    }

    if (!group.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: "User not a member" });
    }

    if (group.admins.some(a => a.toString() === userId)) {
      return res.status(400).json({ message: "Already admin" });
    }

    group.admins.push(userId);
    await group.save();

    res.json({ message: "User promoted to admin" });

  } catch (err) {
    console.error("Make admin error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= REMOVE ADMIN ================= */

exports.removeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group.admins.some(a => a.toString() === req.user.id)) {
      return res.status(403).json({ message: "Only admin can demote" });
    }

    if (group.createdBy.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove creator admin" });
    }

    if (group.admins.length <= 1) {
      return res.status(400).json({ message: "Group must have at least 1 admin" });
    }

    group.admins = group.admins.filter(
      a => a.toString() !== userId
    );

    await group.save();

    res.json({ message: "Admin removed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADD MEMBER ================= */

exports.addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group.admins.some(a => a.toString() === req.user.id)) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (group.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    group.members.push(userId);
    await group.save();

    res.json({ message: "Member added" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= REMOVE MEMBER ================= */

exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.admins.some(a => a.toString() === req.user.id)) {
      return res.status(403).json({ message: "Only admin can remove" });
    }

    if (group.createdBy.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove creator" });
    }

    group.members = group.members.filter(
      m => m.toString() !== userId
    );

    group.admins = group.admins.filter(
      a => a.toString() !== userId
    );

    await group.save();

    res.json({ message: "Member removed" });

  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= LEAVE GROUP ================= */

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await Group.findById(groupId);

    // Prevent last admin leaving
    if (
      group.admins.length === 1 &&
      group.admins[0].toString() === req.user.id
    ) {
      return res.status(400).json({
        message: "You are the only admin. Promote someone first.",
      });
    }

    group.members = group.members.filter(
      m => m.toString() !== req.user.id
    );

    group.admins = group.admins.filter(
      a => a.toString() !== req.user.id
    );

    await group.save();

    res.json({ message: "Left group" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/* ================= GET MY GROUPS ================= */

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id,
    })
      .populate("members", "name profilePic")
      .populate("admins", "name")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name profilePic",
        },
      })
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= SEND GROUP MESSAGE ================= */

exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ message: "Not a group member" });
    }

    const messageData = {
      group: groupId,
      sender: req.user.id,
      content: content || "",
      seenBy: [req.user.id],
    };

    if (req.file) {
      messageData.mediaUrl = req.file.path;
      messageData.mediaType = req.file.mimetype;
      messageData.mediaName = req.file.originalname;
      messageData.messageType = "media";
    }

    let message = await GroupMessage.create(messageData);

    // 🔥 BUILD UNREAD COUNTS
    const unreadUpdate = {};

    group.members.forEach((memberId) => {
      if (memberId.toString() !== req.user.id) {
        unreadUpdate[`unreadCount.${memberId}`] = 1;
      }
    });

    // 🔥 UPDATE GROUP FOR SIDEBAR
    await Group.findByIdAndUpdate(groupId, {
      latestMessage: message._id,
      updatedAt: Date.now(),
      $inc: unreadUpdate,
    });

    message = await GroupMessage.findById(message._id)
      .populate("sender", "name profilePic")
      .populate("seenBy", "name")
      .populate({
        path: "group",
        populate: {
          path: "members",
          select: "name profilePic",
        },
      });

    res.status(201).json(message);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/* ================= GET GROUP MESSAGES ================= */

exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    let clearData = null;

    if (group.clearedBy) {
      clearData = group.clearedBy.find(
        (entry) => entry.user.toString() === userId
      );
    }

    let filter = {
      group: groupId,
      deletedFor: { $ne: userId },
      deletedForEveryone: false,
    };

    // 🔥 FIXED CLEAR CHAT LOGIC
    if (clearData && clearData.clearedAt) {
      filter.createdAt = {
        $gt: new Date(clearData.clearedAt),
      };
    }

    const messages = await GroupMessage.find(filter)
      .populate("sender", "name profilePic")
      .populate("seenBy", "name")
      .sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getAvailableUsers = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const users = await User.find({
      _id: { $nin: group.members }
    }).select("name profilePic");

    res.json(users);

  } catch (err) {
    console.error("Available users error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE GROUP NAME ================= */

exports.updateGroupName = async (req, res) => {
  try {
    const { groupId, name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Group name required" });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can change
    if (!group.admins.some(a => a.toString() === req.user.id)) {
      return res.status(403).json({ message: "Only admin can update name" });
    }

    group.name = name.trim();
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "name profilePic")
      .populate("admins", "name");

    res.json(updatedGroup);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markGroupMessagesSeen = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // find messages NOT seen by this user
    const messages = await GroupMessage.find({
      group: groupId,
      seenBy: { $ne: userId },
    });

    // update
    await GroupMessage.updateMany(
      {
        group: groupId,
        seenBy: { $ne: userId },
      },
      {
        $addToSet: { seenBy: userId },
      }
    );

    // 🔥 SOCKET EMIT
    const wss = req.app.get("wss");

    if (wss && wss.rooms) {
      const room = wss.rooms.get(`group-${groupId}`);

      if (room) {
        messages.forEach((msg) => {
          room.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "group-seen-update",
                  messageId: msg._id,
                  userId,
                })
              );
            }
          });
        });
      }
    }

    res.json({ message: "Seen updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteGroupMessage = async (req, res) => {
  try {
    const { messageId, deleteType } = req.body; // "me" or "everyone"
    const userId = req.user.id;

    const message = await GroupMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (deleteType === "everyone") {
      // only sender can delete for all
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ message: "Not allowed" });
      }

      message.deletedForEveryone = true;
      message.content = "";
      message.mediaUrl = "";

    } else {
      // delete only for me (WORKS FOR SENDER + RECEIVER)
      const alreadyDeleted = message.deletedFor.some(
        (id) => id.toString() === userId
      );

      if (!alreadyDeleted) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();

    // 🔥 SOCKET EMIT
    const wss = req.app.get("wss");

    if (wss && wss.rooms) {
      const room = wss.rooms.get(`group-${message.group}`);

      if (room) {
        // ✅ CASE 1: delete for everyone → send to ALL
        if (deleteType === "everyone") {
          room.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "group-message-deleted",
                  messageId,
                  deleteType,
                  userId,
                })
              );
            }
          });
        }

        // ✅ CASE 2: delete for me → send ONLY to current user
        if (deleteType === "me") {
          room.forEach((client) => {
            if (
              client.userId?.toString() === userId &&
              client.readyState === 1
            ) {
              client.send(
                JSON.stringify({
                  type: "group-message-deleted",
                  messageId,
                  deleteType,
                  userId,
                })
              );
            }
          });
        }
      }
    }

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearGroupChat = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ SAFETY FIX
    if (!group.clearedBy) {
      group.clearedBy = [];
    }

    // remove old entry
    group.clearedBy = group.clearedBy.filter(
      (entry) => entry.user.toString() !== userId
    );

    // add new
    group.clearedBy.push({
      user: userId,
      clearedAt: new Date(),
    });

    await group.save();

    res.json({ message: "Chat cleared" });
    console.log("Saving clear for:", userId, "at", new Date());

  } catch (err) {
    console.error("CLEAR CHAT ERROR:", err); // 🔥 ADD THIS
    res.status(500).json({ error: err.message });
  }
};

exports.markGroupAsRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    await Group.findByIdAndUpdate(groupId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    res.json({ message: "Group marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// const Group = require("../models/Group");
// const GroupMessage = require("../models/GroupMessage");
// const User = require("../models/User"); // ✅ ADD THIS
// /* ================= CREATE GROUP ================= */

// exports.createGroup = async (req, res) => {
//   try {
//     const { name, description, members } = req.body;

//     if (!name || !members || members.length < 1) {
//       return res.status(400).json({
//         message: "Group name and at least 1 member required",
//       });
//     }

//     const allMembers = [...new Set([...members, req.user.id])];

//     const group = await Group.create({
//       name,
//       description,
//       members: allMembers,
//       admins: [req.user.id], // creator is admin
//       createdBy: req.user.id,
//     });

//     const populatedGroup = await Group.findById(group._id)
//       .populate("members", "name profilePic")
//       .populate("admins", "name");

//     res.status(201).json(populatedGroup);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= UPDATE GROUP PROFILE PIC ================= */

// exports.updateGroupPic = async (req, res) => {
//   try {
//     const { groupId } = req.body;

//    const group = await Group.findById(groupId);

// if (!group) {
//   return res.status(404).json({ message: "Group not found" });
// }
//     // Only members can change
//     if (!group.members.some(m => m.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Not a group member" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "No image uploaded" });
//     }

//     group.groupPic = req.file.path;
//     await group.save();

//     res.json({ message: "Group picture updated", groupPic: group.groupPic });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= MAKE ADMIN ================= */

// exports.makeAdmin = async (req, res) => {
//   try {
//     const { groupId, userId } = req.body;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     if (!group.admins.some(a => a.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Only admin can promote" });
//     }

//     if (group.admins.length >= 4) {
//       return res.status(400).json({ message: "Max 4 admins allowed" });
//     }

//     if (!group.members.some(m => m.toString() === userId)) {
//       return res.status(400).json({ message: "User not a member" });
//     }

//     if (group.admins.some(a => a.toString() === userId)) {
//       return res.status(400).json({ message: "Already admin" });
//     }

//     group.admins.push(userId);
//     await group.save();

//     res.json({ message: "User promoted to admin" });

//   } catch (err) {
//     console.error("Make admin error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= REMOVE ADMIN ================= */

// exports.removeAdmin = async (req, res) => {
//   try {
//     const { groupId, userId } = req.body;

//     const group = await Group.findById(groupId);

//     if (!group.admins.some(a => a.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Only admin can demote" });
//     }

//     if (group.createdBy.toString() === userId) {
//       return res.status(400).json({ message: "Cannot remove creator admin" });
//     }

//     if (group.admins.length <= 1) {
//       return res.status(400).json({ message: "Group must have at least 1 admin" });
//     }

//     group.admins = group.admins.filter(
//       a => a.toString() !== userId
//     );

//     await group.save();

//     res.json({ message: "Admin removed" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= ADD MEMBER ================= */

// exports.addMember = async (req, res) => {
//   try {
//     const { groupId, userId } = req.body;

//     const group = await Group.findById(groupId);

//     if (!group.admins.some(a => a.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Only admin can add members" });
//     }

//     if (group.members.some(m => m.toString() === userId)) {
//       return res.status(400).json({ message: "Already a member" });
//     }

//     group.members.push(userId);
//     await group.save();

//     res.json({ message: "Member added" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= REMOVE MEMBER ================= */

// exports.removeMember = async (req, res) => {
//   try {
//     const { groupId, userId } = req.body;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     if (!group.admins.some(a => a.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Only admin can remove" });
//     }

//     if (group.createdBy.toString() === userId) {
//       return res.status(400).json({ message: "Cannot remove creator" });
//     }

//     group.members = group.members.filter(
//       m => m.toString() !== userId
//     );

//     group.admins = group.admins.filter(
//       a => a.toString() !== userId
//     );

//     await group.save();

//     res.json({ message: "Member removed" });

//   } catch (err) {
//     console.error("Remove member error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= LEAVE GROUP ================= */

// exports.leaveGroup = async (req, res) => {
//   try {
//     const { groupId } = req.body;

//     const group = await Group.findById(groupId);

//     // Prevent last admin leaving
//     if (
//       group.admins.length === 1 &&
//       group.admins[0].toString() === req.user.id
//     ) {
//       return res.status(400).json({
//         message: "You are the only admin. Promote someone first.",
//       });
//     }

//     group.members = group.members.filter(
//       m => m.toString() !== req.user.id
//     );

//     group.admins = group.admins.filter(
//       a => a.toString() !== req.user.id
//     );

//     await group.save();

//     res.json({ message: "Left group" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// /* ================= GET MY GROUPS ================= */

// exports.getMyGroups = async (req, res) => {
//   try {
//     const groups = await Group.find({
//       members: req.user.id,
//     })
//       .populate("members", "name profilePic")
//       .populate("admins", "name");

//     res.json(groups);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= SEND GROUP MESSAGE ================= */

// exports.sendGroupMessage = async (req, res) => {
//   try {
//     const { groupId, content } = req.body;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     if (!group.members.some(m => m.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Not a group member" });
//     }

//     const messageData = {
//       group: groupId,
//       sender: req.user.id,
//       content: content || "",
//       seenBy: [req.user.id],
//     };

//     if (req.file) {
//       messageData.mediaUrl = req.file.path;
//       messageData.mediaType = req.file.mimetype;
//       messageData.mediaName = req.file.originalname;
//       messageData.messageType = "media";
//     }

//     let message = await GroupMessage.create(messageData);

//     message = await GroupMessage.findById(message._id)
//       .populate("sender", "name profilePic");

//     res.status(201).json(message);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= GET GROUP MESSAGES ================= */

// exports.getGroupMessages = async (req, res) => {
//   try {
//     const { groupId } = req.params;
//     const userId = req.user.id;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     let clearData = null;

//     if (group.clearedBy) {
//       clearData = group.clearedBy.find(
//         (entry) => entry.user.toString() === userId
//       );
//     }

//     let filter = {
//       group: groupId,
//       deletedFor: { $ne: userId },
//       deletedForEveryone: false,
//     };

//     // 🔥 FIXED CLEAR CHAT LOGIC
//     if (clearData && clearData.clearedAt) {
//       filter.createdAt = {
//         $gt: new Date(clearData.clearedAt),
//       };
//     }

//     const messages = await GroupMessage.find(filter)
//       .populate("sender", "name profilePic")
//       .populate("seenBy", "name")
//       .sort({ createdAt: 1 });

//     res.json(messages);

//   } catch (err) {
//     console.error("GET MESSAGES ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


// exports.getAvailableUsers = async (req, res) => {
//   try {
//     const { groupId } = req.params;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     const users = await User.find({
//       _id: { $nin: group.members }
//     }).select("name profilePic");

//     res.json(users);

//   } catch (err) {
//     console.error("Available users error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /* ================= UPDATE GROUP NAME ================= */

// exports.updateGroupName = async (req, res) => {
//   try {
//     const { groupId, name } = req.body;

//     if (!name || name.trim() === "") {
//       return res.status(400).json({ message: "Group name required" });
//     }

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     // Only admin can change
//     if (!group.admins.some(a => a.toString() === req.user.id)) {
//       return res.status(403).json({ message: "Only admin can update name" });
//     }

//     group.name = name.trim();
//     await group.save();

//     const updatedGroup = await Group.findById(groupId)
//       .populate("members", "name profilePic")
//       .populate("admins", "name");

//     res.json(updatedGroup);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.markGroupMessagesSeen = async (req, res) => {
//   try {
//     const { groupId } = req.body;
//     const userId = req.user.id;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     // find messages NOT seen by this user
//     const messages = await GroupMessage.find({
//       group: groupId,
//       seenBy: { $ne: userId },
//     });

//     // update
//     await GroupMessage.updateMany(
//       {
//         group: groupId,
//         seenBy: { $ne: userId },
//       },
//       {
//         $addToSet: { seenBy: userId },
//       }
//     );

//     // 🔥 SOCKET EMIT
//     const wss = req.app.get("wss");

//     if (wss && wss.rooms) {
//       const room = wss.rooms.get(`group-${groupId}`);

//       if (room) {
//         messages.forEach((msg) => {
//           room.forEach((client) => {
//             if (client.readyState === 1) {
//               client.send(
//                 JSON.stringify({
//                   type: "group-seen-update",
//                   messageId: msg._id,
//                   userId,
//                 })
//               );
//             }
//           });
//         });
//       }
//     }

//     res.json({ message: "Seen updated" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.deleteGroupMessage = async (req, res) => {
//   try {
//     const { messageId, deleteType } = req.body; // "me" or "everyone"
//     const userId = req.user.id;

//     const message = await GroupMessage.findById(messageId);

//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     if (deleteType === "everyone") {
//       // only sender can delete for all
//       if (message.sender.toString() !== userId) {
//         return res.status(403).json({ message: "Not allowed" });
//       }

//       message.deletedForEveryone = true;
//       message.content = "";
//       message.mediaUrl = "";

//     } else {
//       // delete only for me (WORKS FOR SENDER + RECEIVER)
//       const alreadyDeleted = message.deletedFor.some(
//         (id) => id.toString() === userId
//       );

//       if (!alreadyDeleted) {
//         message.deletedFor.push(userId);
//       }
//     }

//     await message.save();

//     // 🔥 SOCKET EMIT
//     const wss = req.app.get("wss");

//     if (wss && wss.rooms) {
//       const room = wss.rooms.get(`group-${message.group}`);

//       if (room) {
//         // ✅ CASE 1: delete for everyone → send to ALL
//         if (deleteType === "everyone") {
//           room.forEach((client) => {
//             if (client.readyState === 1) {
//               client.send(
//                 JSON.stringify({
//                   type: "group-message-deleted",
//                   messageId,
//                   deleteType,
//                   userId,
//                 })
//               );
//             }
//           });
//         }

//         // ✅ CASE 2: delete for me → send ONLY to current user
//         if (deleteType === "me") {
//           room.forEach((client) => {
//             if (
//               client.userId?.toString() === userId &&
//               client.readyState === 1
//             ) {
//               client.send(
//                 JSON.stringify({
//                   type: "group-message-deleted",
//                   messageId,
//                   deleteType,
//                   userId,
//                 })
//               );
//             }
//           });
//         }
//       }
//     }

//     res.json({ message: "Deleted" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.clearGroupChat = async (req, res) => {
//   try {
//     const { groupId } = req.params;
//     const userId = req.user.id;

//     const group = await Group.findById(groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     // ✅ SAFETY FIX
//     if (!group.clearedBy) {
//       group.clearedBy = [];
//     }

//     // remove old entry
//     group.clearedBy = group.clearedBy.filter(
//       (entry) => entry.user.toString() !== userId
//     );

//     // add new
//     group.clearedBy.push({
//       user: userId,
//       clearedAt: new Date(),
//     });

//     await group.save();

//     res.json({ message: "Chat cleared" });
//     console.log("Saving clear for:", userId, "at", new Date());

//   } catch (err) {
//     console.error("CLEAR CHAT ERROR:", err); // 🔥 ADD THIS
//     res.status(500).json({ error: err.message });
//   }
// };