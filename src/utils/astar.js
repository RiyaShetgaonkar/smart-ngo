// src/utils/astar.js

export class AStar {
  constructor(gridSize) {
    this.gridSize = gridSize; // e.g., 20x20 grid
  }

  // Find path from start [x, y] to end [x, y], with obstacles [[x, y], ...]
  findPath(start, end, obstacles) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(JSON.stringify(start), 0);
    fScore.set(JSON.stringify(start), this.heuristic(start, end));

    while (openSet.length > 0) {
      let current = openSet.reduce((a, b) => 
        (fScore.get(JSON.stringify(a)) || Infinity) < (fScore.get(JSON.stringify(b)) || Infinity) ? a : b
      );

      if (current[0] === end[0] && current[1] === end[1]) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(JSON.stringify(current));

      for (let neighbor of this.getNeighbors(current, obstacles)) {
        if (closedSet.has(JSON.stringify(neighbor))) continue;

        let tentativeGScore = (gScore.get(JSON.stringify(current)) || Infinity) + 1;

        if (!openSet.some(node => node[0] === neighbor[0] && node[1] === neighbor[1])) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore.get(JSON.stringify(neighbor)) || Infinity)) {
          continue;
        }

        cameFrom.set(JSON.stringify(neighbor), current);
        gScore.set(JSON.stringify(neighbor), tentativeGScore);
        fScore.set(JSON.stringify(neighbor), tentativeGScore + this.heuristic(neighbor, end));
      }
    }
    return null;
  }

  heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  getNeighbors(node, obstacles) {
    const [x, y] = node;
    const candidates = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
    return candidates.filter(([nx, ny]) => 
      nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize &&
      !obstacles.some(o => o[0] === nx && o[1] === ny)
    );
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(JSON.stringify(current))) {
      current = cameFrom.get(JSON.stringify(current));
      path.unshift(current);
    }
    return path;
  }
}