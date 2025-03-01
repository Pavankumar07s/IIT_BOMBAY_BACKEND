const express = require("express");
const router = express.Router();
const { auth, refreshToken } = require("../controllers/auth");

router.post("/signin", auth);
router.post("/refresh-token", refreshToken);

module.exports = router;
