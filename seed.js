require("dotenv").config(); // Load .env first
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const faker = require("faker");
const User = require("./models/User"); // Adjust path if needed

const sampleImage = "https://cdn-icons-png.flaticon.com/128/3135/3135715.png";

// Connect to DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    seedDB();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// Generate fake users
const generateUsers = async (count) => {
  const users = [];
  const password = await bcrypt.hash("password123", 10);

  for (let i = 0; i < count; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    users.push({
      firstName,
      lastName,
      email: faker.internet.email(firstName, lastName).toLowerCase(),
      password,
      image: sampleImage,
      about: faker.lorem.sentence(),
      mobile: faker.phone.phoneNumberFormat(),
      verified: true,
    });
  }

  return users;
};

// Clean and seed database
const seedDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log("Database cleaned");

    const users = await generateUsers(100);
    await User.insertMany(users);
    console.log("100 users seeded successfully");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};
