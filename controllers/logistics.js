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
      ["Delhi", "Dubai", "air"],
      ["Delhi", "Mumbai", "land"],
      ["Delhi", "Mumbai", "air"],
      ["Mumbai", "Dubai", "air"],
      ["Mumbai", "Dubai", "sea"],
      ["Chennai", "Singapore", "air"],
      ["Chennai", "Singapore", "sea"],
      ["Mumbai", "Singapore", "sea"],
      ["Kolkata", "Hong Kong", "air"],

      // Middle East Connections
      ["Dubai", "London", "air"],
      ["Dubai", "Rotterdam", "sea"],
      ["Dubai", "Singapore", "air"],
      ["Dubai", "Doha", "land"],
      ["Abu Dhabi", "Doha", "air"],

      // European Routes
      ["London", "Rotterdam", "land"],
      ["London", "Paris", "land"],
      ["Paris", "Frankfurt", "land"],
      ["Rotterdam", "Hamburg", "land"],
      ["Rotterdam", "Amsterdam", "land"],
      ["Frankfurt", "Hamburg", "land"],

      // Asian Routes
      ["Singapore", "Hong Kong", "air"],
      ["Singapore", "Hong Kong", "sea"],
      ["Hong Kong", "Shanghai", "air"],
      ["Hong Kong", "Shanghai", "sea"],

      // Trans-Atlantic Routes
      ["London", "New York", "air"],
      ["Rotterdam", "New York", "sea"],
      ["Paris", "New York", "air"],

      // American Routes
      ["New York", "Los Angeles", "air"],
      ["New York", "Los Angeles", "land"],

      // Train Routes - India
      ["New Delhi Railway", "Mumbai Central", "train"],
      ["Mumbai Central", "Chennai Central", "train"],
      ["Chennai Central", "Howrah", "train"],
      ["Howrah", "New Delhi Railway", "train"],

      // Intermodal Connections
      ["New Delhi Railway", "Delhi", "land"],
      ["Mumbai Central", "Mumbai", "land"],
      ["Chennai Central", "Chennai", "land"],
      ["Howrah", "Kolkata", "land"],
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

    // Add routes between stations using dynamic fare and time calculations
    let routesAdded = 0;
    routes.forEach(([from, to, mode]) => {
      if (allowedModes.includes(mode)) {
        // Find station coordinates from the stationsList
        const stationFrom = stationsList.find((s) => s.name === from);
        const stationTo = stationsList.find((s) => s.name === to);
        if (stationFrom && stationTo) {
          // Calculate distance (in kilometers)
          const distance = calculateDistance(
            stationFrom.lat,
            stationFrom.lng,
            stationTo.lat,
            stationTo.lng
          );
          // Define cost factor ($ per km) and speed (km/hr) per mode
          let costFactor, speed;
          switch (mode) {
            case "air":
              costFactor = 0.25; // example: $0.25 per km
              speed = 900; // average air speed ~900 km/h
              break;
            case "sea":
              costFactor = 0.1; // example: $0.10 per km
              speed = 30; // average sea speed ~30 km/h
              break;
            case "land":
              costFactor = 0.2; // example: $0.20 per km
              speed = 80; // average land speed ~80 km/h
              break;
            case "train":
              costFactor = 0.15; // example: $0.15 per km
              speed = 100; // average train speed ~100 km/h
              break;
            default:
              costFactor = 0.2;
              speed = 60;
          }
          // Compute dynamic cost and time
          const dynamicCost = Math.ceil(
            distance * costFactor * weight * quantity
          );
          const dynamicTime = Math.ceil(distance / speed);

          try {
            graph.addRoute(from, to, mode, dynamicCost, dynamicTime);
            routesAdded++;
            console.log(
              `Added route: ${from} -> ${to} via ${mode} | Distance: ${distance.toFixed(
                1
              )} km, Cost: ${dynamicCost}, Time: ${dynamicTime} hrs`
            );
          } catch (error) {
            console.warn(
              `Failed to add route ${from} -> ${to}: ${error.message}`
            );
          }
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
