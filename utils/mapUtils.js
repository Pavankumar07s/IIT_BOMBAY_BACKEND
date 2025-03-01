/**
 * Calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
const findNearestNode = (lat, lng, nodes) => {
  if (!nodes || nodes.length === 0) {
    console.error("No nodes provided to findNearestNode");
    return null;
  }

  // Debug logging
  console.log("Finding nearest node for coordinates:", { lat, lng });
  console.log("Number of available nodes:", nodes.length);

  let nearestNode = null;
  let shortestDistance = Infinity;

  nodes.forEach((node) => {
    if (!node.lat || !node.lng) {
      console.warn("Invalid node format:", node);
      return;
    }

    const distance = calculateDistance(lat, lng, node.lat, node.lng);
    console.log(`Distance to ${node.name}: ${distance}km`);

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestNode = node.name;
      console.log(`New nearest node: ${node.name} at ${distance}km`);
    }
  });

  if (!nearestNode) {
    console.error("Could not find nearest node");
    return null;
  }

  const result = {
    nodeName: nearestNode,
    distance: shortestDistance,
  };

  console.log("Returning nearest node:", result);
  return result;
};

module.exports = {
  calculateDistance,
  calculateFare,
  generateOTP,
  findNearestNode,
};
