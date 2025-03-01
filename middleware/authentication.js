const jwt = require("jsonwebtoken");
const { UnauthenticatedError, NotFoundError } = require("../errors");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Set complete user object in req
    req.user = {
      userId: user._id,
      phone: user.phone,
      role: user.role,
    };

    req.socket = req.io;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    throw new UnauthenticatedError("Authentication invalid");
  }
};

module.exports = auth;
