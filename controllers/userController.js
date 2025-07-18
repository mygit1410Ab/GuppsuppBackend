const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// Helper function to save base64 image to disk
const saveBase64Image = (base64String, userId) => {
  // Extract base64 data (remove "data:image/...;base64," prefix)
  const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image string");
  }

  const ext = matches[1]; // e.g. "jpeg", "png"
  const data = matches[2];
  const buffer = Buffer.from(data, "base64");
  const filename = `user_${userId}_${Date.now()}.${ext}`;
  const uploadDir = path.join(__dirname, "..", "uploads");

  // Ensure uploads folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, buffer);

  return filename; // return filename for URL construction
};

// Update User Controller
exports.updateUser = async (req, res) => {
  try {
    const { about, mobile, image: base64Image } = req.body;
    const updateData = { about, mobile };

    // If base64 image string is present, save file and set image URL
    if (base64Image) {
      try {
        const filename = saveBase64Image(base64Image, req.user.id);
        updateData.image = `${req.protocol}://${req.get(
          "host"
        )}/uploads/${filename}`;
      } catch (e) {
        return res.status(400).json({
          status: false,
          message: "Invalid image data",
          error: e.message,
        });
      }
    } else if (req.file) {
      // Optional: Support file upload via multer if still used
      updateData.image = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, select: "-password -otp -__v" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

// Get All Users (except current)
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "-password -otp -__v"
    );

    res.status(200).json({
      status: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};
