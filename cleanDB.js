require("dotenv").config(); // Load .env variables
const mongoose = require("mongoose");
const User = require("./models/User"); // Adjust path if needed

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    return cleanDB();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Clean database function
const cleanDB = async () => {
  try {
    const result = await User.deleteMany({});
    console.log(`Database cleaned: ${result.deletedCount} user(s) removed`);
    process.exit(0);
  } catch (err) {
    console.error("Error cleaning database:", err);
    process.exit(1);
  }
};
