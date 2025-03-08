/**
 * Calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const calculateFare = (distance) => {
  const rateStructure = {
    bike: { baseFare: 10, perKmRate: 5, minimumFare: 25 },
    auto: { baseFare: 15, perKmRate: 7, minimumFare: 30 },
    cabEconomy: { baseFare: 20, perKmRate: 10, minimumFare: 50 },
    cabPremium: { baseFare: 30, perKmRate: 15, minimumFare: 70 },
  };

  const fareCalculation = (baseFare, perKmRate, minimumFare) => {
    const calculatedFare = baseFare + distance * perKmRate;
    return Math.max(calculatedFare, minimumFare);
  };

  return {
    bike: fareCalculation(
      rateStructure.bike.baseFare,
      rateStructure.bike.perKmRate,
      rateStructure.bike.minimumFare
    ),
    auto: fareCalculation(
      rateStructure.auto.baseFare,
      rateStructure.auto.perKmRate,
      rateStructure.auto.minimumFare
    ),
    cabEconomy: fareCalculation(
      rateStructure.cabEconomy.baseFare,
      rateStructure.cabEconomy.perKmRate,
      rateStructure.cabEconomy.minimumFare
    ),
    cabPremium: fareCalculation(
      rateStructure.cabPremium.baseFare,
      rateStructure.cabPremium.perKmRate,
      rateStructure.cabPremium.minimumFare
    ),
  };
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Finds the nearest graph node to given coordinates
 */
const findNearestNode = (lat, lng, nodes, maxDistance = 1000) => {
  let nearest = null;
  let minDistance = Infinity;

  console.log("Finding nearest node for:", { lat, lng });
  console.log(
    "Available nodes:",
    nodes.map((n) => ({
      name: n.name,
      coords: [n.lat, n.lng],
    }))
  );

  nodes.forEach((node) => {
    const distance = calculateDistance(lat, lng, node.lat, node.lng);

    console.log(`Distance to ${node.name}: ${distance.toFixed(2)} km`);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        nodeName: node.name,
        distance,
        coordinates: {
          latitude: node.lat,
          longitude: node.lng,
        },
      };
    }
  });

  console.log("Nearest node result:", {
    node: nearest?.nodeName,
    distance: nearest?.distance.toFixed(2),
  });

  // Return the nearest node even if it's beyond maxDistance
  return nearest;
};

module.exports = {
  calculateDistance,
  calculateFare,
  generateOTP,
  findNearestNode,
};
