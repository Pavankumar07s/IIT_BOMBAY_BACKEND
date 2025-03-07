// stationGraph.js

const TRANSPORT_CAPACITY = {
  air: 1000, // passengers or cargo tons
  land: 2000,
  sea: 5000,
};

class StationGraph {
  constructor() {
    // nodes: key = station name, value = { type, modes, lat, lng }
    this.nodes = {};
    // adjList: key = station name, value = an object mapping neighbor station -> edge properties
    // edge properties: { mode, cost, time }
    this.adjList = {};
  }

  /**
   * Adds a station (node) to the graph.
   * @param {string} station - Station name.
   * @param {string} type - The type of station (e.g., "city", "airport", "seaport").
   * @param {Array<string>} modes - Array of transport modes available at this station.
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   */
  addStation(station, type, modes, lat, lng) {
    this.nodes[station] = { type, modes, lat, lng };
    if (!this.adjList[station]) {
      this.adjList[station] = {};
    }
  }

  /**
   * Adds a route (edge) between two stations.
   * Assumes an undirected graph (route added both ways).
   * @param {string} from - Starting station.
   * @param {string} to - Destination station.
   * @param {string} mode - Mode of transport for this edge.
   * @param {number} cost - Cost of travel along this route.
   * @param {number} time - Travel time along this route.
   */
  addRoute(from, to, mode, cost, time) {
    if (!this.nodes[from] || !this.nodes[to]) {
      throw new Error("Both stations must exist in the graph.");
    }
    const capacity = TRANSPORT_CAPACITY[mode];
    // Add edge in both directions with capacity
    this.adjList[from][to] = { mode, cost, time, capacity };
    this.adjList[to][from] = { mode, cost, time, capacity };
  }

  /**
   * Dijkstra's algorithm to find the shortest path (by cost) between two stations.
   * @param {string} start - Starting station.
   * @param {string} end - Destination station.
   * @param {number} costWeight - Weight for cost consideration (0-1)
   * @param {number} timeWeight - Weight for time consideration (0-1)
   * @returns {Object} - Path info including stations, modes, total cost and time
   */
  dijkstra(start, end, costWeight = 0.5, timeWeight = 0.5) {
    if (!this.nodes[start] || !this.nodes[end]) {
      throw new Error("Both start and end stations must exist in the graph.");
    }

    // Initialize distances and previous station map.
    const distances = {};
    const prev = {};
    const modes = {}; // Track transport modes used
    const visited = new Set();

    for (let station in this.nodes) {
      distances[station] = Infinity;
    }
    distances[start] = 0;

    // Simple priority queue: array of objects { station, cost }.
    const queue = [{ station: start, score: 0 }];

    while (queue.length) {
      // Sort queue by cost to simulate a priority queue.
      queue.sort((a, b) => a.score - b.score);
      const current = queue.shift();
      const currStation = current.station;

      if (visited.has(currStation)) continue;
      visited.add(currStation);

      if (currStation === end) break;

      // Explore neighbors.
      for (let neighbor in this.adjList[currStation]) {
        const edge = this.adjList[currStation][neighbor];
        // Calculate weighted score based on both cost and time
        const score = edge.cost * costWeight + edge.time * timeWeight;
        const newDist = distances[currStation] + score;
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          prev[neighbor] = currStation;
          modes[neighbor] = edge.mode; // Store the transport mode used
          queue.push({ station: neighbor, score: newDist });
        }
      }
    }

    // Reconstruct the path with transport modes
    const path = [];
    const transportModes = [];
    let current = end;

    if (distances[end] === Infinity)
      return { path: [], modes: [], cost: 0, time: 0 };

    while (current) {
      path.push(current);
      if (prev[current]) {
        transportModes.unshift(modes[current]);
      }
      current = prev[current];
    }

    return {
      path: path.reverse(),
      modes: transportModes,
      cost: this.calculatePathCost(path),
      time: this.calculatePathTime(path),
      // Add segments that combine locations with their transport modes
      segments: path.slice(1).map((station, index) => ({
        from: path[index],
        to: station,
        mode: transportModes[index],
        cost: this.adjList[path[index]][station].cost,
        time: this.adjList[path[index]][station].time,
        capacity: this.adjList[path[index]][station].capacity,
      })),
    };
  }

  /**
   * Calculates the total cost of a given path.
   * @param {Array<string>} path - Array of station names.
   * @returns {number} - Total cost computed by summing the cost of each edge in the path.
   */
  calculatePathCost(path) {
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      if (this.adjList[from] && this.adjList[from][to]) {
        totalCost += this.adjList[from][to].cost;
      } else {
        return Infinity;
      }
    }
    return totalCost;
  }

  /**
   * New method to calculate total time of a path
   */
  calculatePathTime(path) {
    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      if (this.adjList[from] && this.adjList[from][to]) {
        totalTime += this.adjList[from][to].time;
      } else {
        return Infinity;
      }
    }
    return totalTime;
  }

  /**
   * Yen's K Shortest Paths algorithm to find multiple alternative shortest paths.
   * @param {string} source - Starting station.
   * @param {string} destination - Destination station.
   * @param {number} k - Number of shortest paths to find.
   * @returns {Array<Array<string>>} - Array of paths (each path is an array of station names).
   */
  yenKShortestPaths(source, destination, k) {
    if (!this.nodes[source] || !this.nodes[destination]) {
      throw new Error(
        "Both source and destination stations must exist in the graph."
      );
    }

    const A = []; // List of shortest paths found.
    const B = []; // Candidate paths.

    const shortestPathInfo = this.dijkstra(source, destination);
    if (shortestPathInfo.path.length === 0) return A;
    A.push({
      path: shortestPathInfo.path,
      modes: shortestPathInfo.modes,
      cost: this.calculatePathCost(shortestPathInfo.path),
      time: this.calculatePathTime(shortestPathInfo.path),
      segments: shortestPathInfo.segments,
    });

    for (let i = 1; i < k; i++) {
      for (let j = 0; j < A[i - 1].path.length - 1; j++) {
        const spurNode = A[i - 1].path[j];
        const rootPath = A[i - 1].path.slice(0, j + 1);

        // Store removed edges to restore later.
        const removedEdges = [];
        // Remove edges that are part of previous k-shortest paths with the same root path.
        for (let path of A) {
          if (
            path.path.length > j &&
            rootPath.join() === path.path.slice(0, j + 1).join()
          ) {
            const from = path.path[j];
            const to = path.path[j + 1];
            if (this.adjList[from] && this.adjList[from][to]) {
              removedEdges.push({ from, to, data: this.adjList[from][to] });
              delete this.adjList[from][to];
            }
          }
        }

        // Find spur path from spurNode to destination.
        const spurPathInfo = this.dijkstra(spurNode, destination);
        if (spurPathInfo.path.length > 0) {
          const totalPath = rootPath.concat(spurPathInfo.path.slice(1));
          const combinedPathInfo = this.dijkstra(source, destination); // Get full path info
          B.push({
            path: totalPath,
            modes: combinedPathInfo.modes,
            cost: this.calculatePathCost(totalPath),
            time: this.calculatePathTime(totalPath),
            segments: combinedPathInfo.segments,
          });
        }

        // Restore removed edges.
        for (let edge of removedEdges) {
          this.adjList[edge.from][edge.to] = edge.data;
        }
      }

      if (B.length === 0) break;
      // Sort candidate paths by cost and select the one with the smallest cost
      B.sort((a, b) => a.cost - b.cost);
      const nextPath = B.shift();
      A.push(nextPath);
    }
    return A;
  }

  /**
   * Find multiple paths between two stations
   * @param {string} source - Starting station
   * @param {string} destination - Destination station
   * @param {number} k - Number of paths to find
   * @returns {Array} Array of path objects with segments, cost, time etc.
   */
  findAllPaths(source, destination, k) {
    if (!this.nodes[source] || !this.nodes[destination]) {
      throw new Error(
        "Both source and destination stations must exist in the graph."
      );
    }

    const paths = [];

    // Get k paths using Yen's algorithm
    const kPaths = this.yenKShortestPaths(source, destination, k);

    // Format each path with required information
    kPaths.forEach((pathInfo) => {
      const path = pathInfo.path;
      const segments = [];

      // Create segments from path
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const edge = this.adjList[from][to];

        segments.push({
          from,
          to,
          mode: edge.mode,
          cost: edge.cost,
          time: edge.time,
          capacity: edge.capacity || 1000, // Default capacity if not specified
          fromCoords: {
            latitude: this.nodes[from].lat,
            longitude: this.nodes[from].lng,
          },
          toCoords: {
            latitude: this.nodes[to].lat,
            longitude: this.nodes[to].lng,
          },
        });
      }

      paths.push({
        path,
        segments,
        totalCost: this.calculatePathCost(path),
        totalTime: this.calculatePathTime(path),
      });
    });

    return paths;
  }
}

module.exports = StationGraph;
