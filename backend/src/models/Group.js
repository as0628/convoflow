const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    groupPic: {
      type: String,
      default: "",
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    onlyAdminsCanMessage: {
      type: Boolean,
      default: false,
    },

    // 🔥 NEW: latest group message for sidebar
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
      default: null,
    },

    // 🔥 NEW: unread count per user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    // clear chat per user
    clearedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        clearedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

/* ================= INDEX ================= */
groupSchema.index({ members: 1, updatedAt: -1 });

groupSchema.pre("save", function () {
  const isCreatorAdmin = this.admins.some(
    (admin) => admin.toString() === this.createdBy.toString()
  );

  if (!isCreatorAdmin) {
    this.admins.push(this.createdBy);
  }

  if (this.admins.length > 4) {
    throw new Error("Maximum 4 admins allowed");
  }
});

groupSchema.methods.isAdmin = function (userId) {
  return this.admins.some(
    (admin) => admin.toString() === userId.toString()
  );
};

groupSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.toString() === userId.toString()
  );
};

module.exports = mongoose.model("Group", groupSchema);

// const mongoose = require("mongoose");

// const groupSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     description: {
//       type: String,
//       default: "",
//     },

//     groupPic: {
//       type: String,
//       default: "",
//     },

//     members: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     admins: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       },
//     ],

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     onlyAdminsCanMessage: {
//       type: Boolean,
//       default: false,
//     },

//     // 🔥 ADD THIS (VERY IMPORTANT)
//     clearedBy: [
//       {
//         user: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//         },
//         clearedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// /* ================= INDEX ================= */
// groupSchema.index({ members: 1 });

// groupSchema.pre("save", function () {
//   const isCreatorAdmin = this.admins.some(
//     (admin) => admin.toString() === this.createdBy.toString()
//   );

//   if (!isCreatorAdmin) {
//     this.admins.push(this.createdBy);
//   }

//   if (this.admins.length > 4) {
//     throw new Error("Maximum 4 admins allowed");
//   }
// });

// groupSchema.methods.isAdmin = function (userId) {
//   return this.admins.some(
//     (admin) => admin.toString() === userId.toString()
//   );
// };

// groupSchema.methods.isMember = function (userId) {
//   return this.members.some(
//     (member) => member.toString() === userId.toString()
//   );
// };

// module.exports = mongoose.model("Group", groupSchema);

