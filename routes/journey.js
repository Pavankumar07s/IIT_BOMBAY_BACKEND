const express = require("express");
const router = express.Router();
const {
  createJourney,
  completeJourney,
  getAllJourneys,
} = require("../controllers/journey");

router.post("/create", createJourney);
router.patch("/complete/:journeyId", completeJourney);
router.get("/all", getAllJourneys);

module.exports = router;
