const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
  try {
    // Read token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request (so controllers can use req.user)
    req.user = decoded;

    // Proceed to next middleware/route handler
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

module.exports = {
  authenticateUser
};
