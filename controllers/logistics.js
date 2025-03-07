const StationGraph = require("../utils/graph.js");
const { calculateDistance, findNearestNode } = require("../utils/mapUtils.js");

const findRoutes = async (req, res) => {
  try {
    const {
      source,
      destination,
      weight,
      quantity,
      sourceCoords,
      destCoords,
      allowedModes = ["air", "sea", "land", "train"],
    } = req.body;

    console.log("Request received on server");
    console.log("Processing request with data:", {
      source,
      destination,
      weight,
      quantity,
      sourceCoords,
      destCoords,
      allowedModes,
    });

    // Validate request data
    if (!sourceCoords || !destCoords) {
      return res.status(400).json({
        success: false,
        message: "Source and destination coordinates are required",
      });
    }

    const MAX_DISTANCE = 1000; // 1000km search radius
    const graph = new StationGraph();

    // Define all stations - Keep your existing comprehensive stations data
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

      // Train Stations - India
      ["New Delhi Railway", "station", ["train"], 28.6429, 77.2191],
      ["Mumbai Central", "station", ["train"], 18.9711, 72.8193],
      ["Chennai Central", "station", ["train"], 13.0827, 80.2707],
      ["Howrah", "station", ["train"], 22.5851, 88.3425],
    ];

    // Keep your existing comprehensive routes data
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

      // Train Routes - India
      ["New Delhi Railway", "Mumbai Central", "train", 120, 16],
      ["Mumbai Central", "Chennai Central", "train", 150, 24],
      ["Chennai Central", "Howrah", "train", 180, 28],
      ["Howrah", "New Delhi Railway", "train", 160, 20],

      // Intermodal Connections
      ["New Delhi Railway", "Delhi", "land", 10, 0.5],
      ["Mumbai Central", "Mumbai", "land", 8, 0.5],
      ["Chennai Central", "Chennai", "land", 5, 0.5],
      ["Howrah", "Kolkata", "land", 7, 0.5],
    ];

    // Add stations that support allowed modes
    let stationsAdded = 0;
    stations.forEach(([name, type, modes, lat, lng]) => {
      const availableModes = modes.filter((mode) =>
        allowedModes.includes(mode)
      );
      if (availableModes.length > 0) {
        graph.addStation(name, type, availableModes, lat, lng);
        stationsAdded++;
        console.log(
          `Added station: ${name} with modes: ${availableModes.join(", ")}`
        );
      }
    });
    console.log(`Total stations added: ${stationsAdded}`);

    // Create list of stations for nearest node search
    const stationsList = stations.map(([name, _, __, lat, lng]) => ({
      name,
      lat,
      lng,
    }));

    // Find nearest stations
    const nearestSource = findNearestNode(
      sourceCoords.latitude,
      sourceCoords.longitude,
      stationsList,
      MAX_DISTANCE
    );

    const nearestDest = findNearestNode(
      destCoords.latitude,
      destCoords.longitude,
      stationsList,
      MAX_DISTANCE
    );

    console.log("Nearest nodes found:", {
      source: nearestSource,
      destination: nearestDest,
    });

    if (!nearestSource || !nearestDest) {
      return res.status(404).json({
        success: false,
        message: "No stations found within reasonable distance",
      });
    }

    // Add routes between stations
    let routesAdded = 0;
    routes.forEach(([from, to, mode, cost, time]) => {
      if (allowedModes.includes(mode)) {
        try {
          graph.addRoute(from, to, mode, cost, time);
          routesAdded++;
          console.log(`Added route: ${from} -> ${to} via ${mode}`);
        } catch (error) {
          console.warn(
            `Failed to add route ${from} -> ${to}: ${error.message}`
          );
        }
      }
    });
    console.log(`Total routes added: ${routesAdded}`);

    // Find paths
    const pathOptions = graph.findAllPaths(
      nearestSource.nodeName,
      nearestDest.nodeName,
      5
    );

    if (!pathOptions || pathOptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No routes found between ${nearestSource.nodeName} and ${nearestDest.nodeName} using selected modes`,
      });
    }

    // Format and filter routes
    const formattedRoutes = pathOptions
      .map((route) => ({
        ...route,
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
      }))
      .filter((route) => route.feasible);

    if (formattedRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No feasible routes found for the given package weight",
      });
    }

    console.log(`Found ${formattedRoutes.length} feasible routes`);
    return res.status(200).json({
      success: true,
      data: formattedRoutes,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  findRoutes,
};
