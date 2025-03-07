const stations = [
  // Major Indian Cities
  ["Delhi", "city", ["land", "air"], 28.6139, 77.209],
  ["Mumbai", "city", ["land", "air", "sea"], 19.076, 72.8777],
  ["Chennai", "city", ["land", "air", "sea"], 13.0827, 80.2707],
  ["Bangalore", "city", ["land", "air"], 12.9716, 77.5946],
  ["Kolkata", "city", ["land", "air", "sea"], 22.5726, 88.3639],
  ["Hyderabad", "city", ["land", "air"], 17.385, 78.4867],

  // Add more stations near Pune/Mumbai region
  ["Pune", "hub", ["air", "land"], 18.5204, 73.8567],
  ["Pune Railway", "station", ["train"], 18.5285, 73.8743],
  ["Pimpri", "station", ["land"], 18.6298, 73.8131],
  ["Chinchwad", "station", ["land"], 18.6298, 73.7997],

  // Major European Cities & Ports
  // ... rest of your existing stations ...
];

module.exports = stations;
