const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image";

    if (file.mimetype.startsWith("image")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video")) {
      resourceType = "video";
    } else {
      resourceType = "raw"; // 🔥 VERY IMPORTANT FOR PDF, DOC, TXT
    }

    return {
      folder: "convoflow",
      resource_type: resourceType,
      public_id: Date.now() + "-" + file.originalname,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
