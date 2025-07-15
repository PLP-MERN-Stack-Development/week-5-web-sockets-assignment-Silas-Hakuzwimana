const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide username, email and password" });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    // ✅ Don't hash manually — let the model's pre('save') hook do it
    const newUser = new User({
      username,
      email,
      password,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(
      "Login attempt:",
      `Username : ${username} and Password: ${password}`
    );
    if (!username || !password)
      return res
        .status(400)
        .json({ error: "Please provide username and password" });

    const user = await User.findOne({ username });

    console.log("User found:", user);
    console.log("Username: ", user.username);
    console.log("User email:", user ? user.email : "No user found");
    console.log("User password:", user ? user.password : "No user found");
    console.log("Password to compare:", password);
    console.log(
      "Password match:",
      user ? await bcrypt.compare(password, user.password) : false
    );

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: "Please provide your email" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ error: "User with this email does not exist" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
  <div style="font-family: 'Segoe UI', sans-serif; background-color: #f8f9fc; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(to right, #6366f1, #8b5cf6); padding: 20px; color: white; text-align: center;">
        <h2 style="margin: 0;">ChatFlow Password Reset</h2>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333333;">
          Hi there,
        </p>
        <p style="font-size: 16px; color: #333333;">
          We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
        </p>
        <p style="font-size: 16px; color: #333333;">
          Click the button below to reset your password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" target="_blank" style="background-color: #4f46e5; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #777;">
          This link will expire in 1 hour for your security.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          If you're having trouble clicking the button, copy and paste the following link into your browser:<br>
          <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
        </p>
      </div>
    </div>
  </div>
`;

    await sendEmail({
      to: user.email,
      subject: "ChatFlow Password Reset",
      html,
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot Password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ error: "Password is required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10); // hash new password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Get User Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware
    const { username, email } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json({ error: "Please provide username and email" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check for existing username or email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: userId }, // exclude current user
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    user.username = username;
    user.email = email;
    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update User Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await User.deleteOne({ _id: userId });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
