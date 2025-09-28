const express = require("express");
const { UserController } = require("../controllers");
const { authenticateUser } = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/signup", UserController.handleSignup);
router.post("/login", UserController.handleLogin);

router.get("/me", authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", authenticateUser, (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
