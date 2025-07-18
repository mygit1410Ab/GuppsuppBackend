const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.post("/update", auth, userController.updateUser);

router.get("/", auth, userController.getAllUsers);

module.exports = router;
