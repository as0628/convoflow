const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { name, username, phone, email, password } = req.body;

    if (!name || !username || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Username can only contain letters, numbers, and underscore",
      });
    }

    // ✅ Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits",
      });
    }

    // ✅ Email validation (NEW 🔥)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // ✅ Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { username }],
    });

    if (existingUser) {
      let message = "User already exists";
      if (existingUser.email === email)
        message = "Email already in use";
      else if (existingUser.phone === phone)
        message = "Phone already in use";
      else if (existingUser.username === username)
        message = "Username already taken";

      return res.status(400).json({ message });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      phone,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful",
      userId: user._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { username: identifier },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// // ================= SIGNUP =================
// exports.signup = async (req, res) => {
//   try {
//     const { name, username, phone, email, password } = req.body;

//     if (!name || !username || !phone || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // ✅ Username format validation
//     const usernameRegex = /^[a-zA-Z0-9_]+$/;
//     if (!usernameRegex.test(username)) {
//       return res.status(400).json({
//         message:
//           "Username can only contain letters, numbers, and underscore",
//       });
//     }

//     // ✅ Check existing user (email / phone / username)
//     const existingUser = await User.findOne({
//       $or: [{ email }, { phone }, { username }],
//     });

//     if (existingUser) {
//       let message = "User already exists";
//       if (existingUser.email === email)
//         message = "Email already in use";
//       else if (existingUser.phone === phone)
//         message = "Phone already in use";
//       else if (existingUser.username === username)
//         message = "Username already taken";

//       return res.status(400).json({ message });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = await User.create({
//       name,
//       username,
//       phone,
//       email,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       message: "Signup successful",
//       userId: user._id,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Username already exists" });
//     }
//     res.status(500).json({ error: error.message });
//   }
// };

// // ================= LOGIN =================
// exports.login = async (req, res) => {
//   try {
//     const { identifier, password } = req.body;

//     if (!identifier || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // ✅ Login with email / phone / username
//     const user = await User.findOne({
//       $or: [
//         { email: identifier },
//         { phone: identifier },
//         { username: identifier },
//       ],
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         username: user.username, // ✅ added
//         email: user.email,
//         phone: user.phone,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

