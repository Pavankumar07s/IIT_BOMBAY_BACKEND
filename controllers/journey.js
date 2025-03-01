const Journey = require("../models/Journey");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const createJourney = async (req, res) => {
  try {
    const { route, package: packageData } = req.body;

    // Validate user authentication
    if (!req.user?.userId) {
      throw new BadRequestError("User not authenticated");
    }

    // Validate route data
    if (
      !route ||
      !route.startLocation ||
      !route.segments ||
      !Array.isArray(route.segments)
    ) {
      throw new BadRequestError("Invalid route data");
    }

    // Validate package data
    if (
      !packageData ||
      !packageData.type ||
      !packageData.weight ||
      !packageData.quantity
    ) {
      throw new BadRequestError("Invalid package data");
    }

    // Validate coordinates
    if (!route.startLocation.latitude || !route.startLocation.longitude) {
      throw new BadRequestError("Invalid start location coordinates");
    }

    // Validate segments
    const validSegments = route.segments.every(
      (segment) =>
        segment.from &&
        segment.to &&
        segment.mode &&
        segment.fromCoords?.latitude &&
        segment.fromCoords?.longitude &&
        segment.toCoords?.latitude &&
        segment.toCoords?.longitude
    );

    if (!validSegments) {
      throw new BadRequestError("Invalid segment data");
    }

    // Create journey with validated data
    const journey = await Journey.create({
      customer: req.user.userId, // Use userId from auth middleware
      route: {
        startLocation: {
          latitude: Number(route.startLocation.latitude),
          longitude: Number(route.startLocation.longitude),
        },
        path: route.path || [],
        segments: route.segments.map((segment) => ({
          from: segment.from,
          to: segment.to,
          mode: segment.mode,
          fromCoords: {
            latitude: Number(segment.fromCoords.latitude),
            longitude: Number(segment.fromCoords.longitude),
          },
          toCoords: {
            latitude: Number(segment.toCoords.latitude),
            longitude: Number(segment.toCoords.longitude),
          },
          cost: Number(segment.cost || 0),
          time: Number(segment.time || 0),
        })),
        totalCost: Number(route.totalCost || 0),
        totalTime: Number(route.totalTime || 0),
      },

      package: packageData,
      startTime: new Date(),
      status: "IN_PROGRESS",
    });

    const populatedJourney = await journey.populate(
      "customer",
      "name email phone"
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      journey: populatedJourney,
    });
  } catch (error) {
    console.error("Journey creation error:", error);
    throw error;
  }
};

const completeJourney = async (req, res) => {
  const { journeyId } = req.params;

  try {
    const journey = await Journey.findOne({
      _id: journeyId,
      customer: req.user.id,
    });

    if (!journey) {
      throw new NotFoundError("Journey not found");
    }

    journey.status = "COMPLETED";
    journey.completionTime = new Date();
    await journey.save();

    res.status(StatusCodes.OK).json({
      success: true,
      journey,
    });
  } catch (error) {
    throw new BadRequestError("Failed to complete journey");
  }
};

const getAllJourneys = async (req, res) => {
  try {
    const journeys = await Journey.find()
      .sort({ createdAt: -1 })
      .populate("customer", "name email phone");

    res.status(StatusCodes.OK).json({
      success: true,
      journeys,
    });
  } catch (error) {
    throw new BadRequestError("Failed to fetch journeys");
  }
};

module.exports = {
  createJourney,
  completeJourney,
  getAllJourneys,
};
