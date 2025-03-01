const StationGraph = require("../utils/graph.js");
const {
  calculateDistance,
  calculateFare,
  generateOTP,
  findNearestNode,
} = require("../utils/mapUtils.js");

const findRoutes = async (req, res) => {
  try {
    const { source, destination, weight, quantity, sourceCoords, destCoords } =
      req.body;

    console.log("Request payload:", {
      source,
      destination,
      weight,
      quantity,
      sourceCoords,
      destCoords,
    });

    // Input validation with detailed error messages
    const missingFields = [];
    if (!source) missingFields.push("source");
    if (!destination) missingFields.push("destination");
    if (!weight) missingFields.push("weight");
    if (!quantity) missingFields.push("quantity");
    if (!sourceCoords?.latitude || !sourceCoords?.longitude)
      missingFields.push("sourceCoords");
    if (!destCoords?.latitude || !destCoords?.longitude)
      missingFields.push("destCoords");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: ${missingFields.join(", ")}`,
      });
    }

    // Initialize graph with stations and routes
    const graph = new StationGraph();

    // Keep your existing stations and routes data
    const stations = [
      // Major Indian Cities
      ["Delhi", "city", ["land", "air"], 28.6139, 77.209],
      ["Mumbai", "city", ["land", "air", "sea"], 19.076, 72.8777],
      ["Chennai", "city", ["land", "air", "sea"], 13.0827, 80.2707],
      ["Bangalore", "city", ["land", "air"], 12.9716, 77.5946],
      ["Kolkata", "city", ["land", "air", "sea"], 22.5726, 88.3639],
      ["Hyderabad", "city", ["land", "air"], 17.385, 78.4867],

      // Major European Cities & Ports
      ["Rotterdam", "seaport", ["sea", "land"], 51.9244, 4.4777],
      ["Hamburg", "seaport", ["sea", "land"], 53.5488, 9.9872],
      ["London", "city", ["land", "air"], 51.5074, -0.1278],
      ["Paris", "city", ["land", "air"], 48.8566, 2.3522],
      ["Amsterdam", "city", ["land", "air", "sea"], 52.3676, 4.9041],
      ["Frankfurt", "city", ["land", "air"], 50.1109, 8.6821],

      // Middle East Hubs
      ["Dubai", "city", ["land", "air", "sea"], 25.2048, 55.2708],
      ["Abu Dhabi", "city", ["land", "air", "sea"], 24.4539, 54.3773],
      ["Doha", "city", ["land", "air", "sea"], 25.2854, 51.531],

      // Asian Hubs
      ["Singapore", "city", ["land", "air", "sea"], 1.3521, 103.8198],
      ["Hong Kong", "city", ["air", "sea"], 22.3193, 114.1694],
      ["Shanghai", "city", ["land", "air", "sea"], 31.2304, 121.4737],

      // American Hubs
      ["New York", "city", ["land", "air", "sea"], 40.7128, -74.006],
      ["Los Angeles", "city", ["land", "air", "sea"], 34.0522, -118.2437],
    ];

    const routes = [
      // Routes from India
      ["Delhi", "Dubai", "air", 300, 4],
      ["Delhi", "Mumbai", "land", 100, 24],
      ["Delhi", "Mumbai", "air", 150, 2],
      ["Mumbai", "Dubai", "air", 250, 3.5],
      ["Mumbai", "Dubai", "sea", 180, 72],
      ["Chennai", "Singapore", "air", 400, 5.5],
      ["Chennai", "Singapore", "sea", 200, 120],
      ["Mumbai", "Singapore", "sea", 300, 168],
      ["Kolkata", "Hong Kong", "air", 450, 4.5],

      // Middle East Connections
      ["Dubai", "London", "air", 500, 7],
      ["Dubai", "Rotterdam", "sea", 800, 240],
      ["Dubai", "Singapore", "air", 450, 7.5],
      ["Dubai", "Doha", "land", 80, 8],
      ["Abu Dhabi", "Doha", "air", 120, 1],

      // European Routes
      ["London", "Rotterdam", "land", 150, 8],
      ["London", "Paris", "land", 100, 5],
      ["Paris", "Frankfurt", "land", 120, 6],
      ["Rotterdam", "Hamburg", "land", 180, 7],
      ["Rotterdam", "Amsterdam", "land", 50, 1.5],
      ["Frankfurt", "Hamburg", "land", 150, 6],

      // Asian Routes
      ["Singapore", "Hong Kong", "air", 350, 4],
      ["Singapore", "Hong Kong", "sea", 200, 96],
      ["Hong Kong", "Shanghai", "air", 250, 3],
      ["Hong Kong", "Shanghai", "sea", 150, 72],

      // Trans-Atlantic Routes
      ["London", "New York", "air", 800, 8],
      ["Rotterdam", "New York", "sea", 600, 168],
      ["Paris", "New York", "air", 850, 8.5],

      // American Routes
      ["New York", "Los Angeles", "air", 400, 6],
      ["New York", "Los Angeles", "land", 300, 48],
    ];

    // Initialize graph with stations and routes
    stations.forEach(([name, type, modes, lat, lng]) => {
      graph.addStation(name, type, modes, lat, lng);
      console.log(`Added station: ${name} at (${lat}, ${lng})`);
    });

    routes.forEach(([from, to, mode, cost, time]) => {
      graph.addRoute(from, to, mode, cost, time);
      console.log(`Added route: ${from} -> ${to} via ${mode}`);
    });

    // Format stations for nearest node calculation
    const stationNodes = stations.map(([name, _, __, lat, lng]) => ({
      name,
      lat,
      lng,
    }));

    // Find nearest nodes with better error handling
    const nearestSource = findNearestNode(
      sourceCoords.latitude,
      sourceCoords.longitude,
      stationNodes
    );

    const nearestDest = findNearestNode(
      destCoords.latitude,
      destCoords.longitude,
      stationNodes
    );

    if (!nearestSource || !nearestDest) {
      return res.status(404).json({
        success: false,
        message: "Could not find suitable nodes for route calculation",
      });
    }

    console.log("Found nearest nodes:", {
      source: nearestSource,
      destination: nearestDest,
    });

    // Calculate routes
    const pathOptions = graph.yenKShortestPaths(
      nearestSource.nodeName,
      nearestDest.nodeName,
      3
    );

    if (!pathOptions || pathOptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid routes found between the selected locations",
      });
    }

    // Format response
    const formattedRoutes = pathOptions.map((route) => ({
      path: route.path,
      segments: route.segments,
      totalCost: route.cost,
      totalTime: route.time,
      feasible: route.segments.every((segment) => segment.capacity >= weight),
      sourceInfo: {
        selected: source,
        mappedTo: nearestSource.nodeName,
        distance: nearestSource.distance,
      },
      destinationInfo: {
        selected: destination,
        mappedTo: nearestDest.nodeName,
        distance: nearestDest.distance,
      },
    }));
    console.log(formattedRoutes)
    return res.status(200).json({
      success: true,
      data: formattedRoutes,
    });
  } catch (error) {
    console.error("Error in findRoutes:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

module.exports = {
  findRoutes,
};
