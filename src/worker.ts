/* global self */

import { Flame } from "./flame";
import { WorkerMessage } from "./types";

type GeneratePointsMessage = {
  type: "lyapunov",
  payload: {
    attractor: "MSSSRRPADDSO",
    points: 10_000_000,
    skip: 100,
  },
};

// Web Worker for heavy calculations
self.addEventListener("message", (event: {
  data: GeneratePointsMessage
}) => {
  // Handle incoming messages
  switch (event.data.type) {
    case "lyapunov":
      const startFlame = Flame(event.data.payload.attractor);
      const maxPointCount = event.data.payload.points;
      const points = new Float32Array(maxPointCount * 2);
      let pointCount = 0;
      let point: [number, number] = [0, 0];
      const bounds = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      }

      const iterator = startFlame(point);
      for (const [x, y] of iterator) {
        if (pointCount >= maxPointCount) {
          break;
        }

        points[pointCount * 2] = x;
        points[pointCount * 2 + 1] = y;

        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);

        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, x);
        pointCount++;
      }

      // Send back the generated points
      self.postMessage({
        type: "pointsGenerated",
        payload: {
          points,
          pointCount,
          bounds,
        }
      } as WorkerMessage<{
        points: Float32Array,
        pointCount: number;
        bounds: {
          minX: number;
          minY: number;
          maxX: number;
          maxY: number;
        }
      }>);
      break;
    default:
      console.error("Unknown message type:", event.data);
      break;
  }
});
