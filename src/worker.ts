/* global self */

import { Flame } from "./flame";
import {
  AttractorConfig,
  AttractorError,
  Bounds,
  ErrorResponse,
  ProgressResponse,
  ResultsResponse,
  WorkerRequest,
} from "./types";

// Web Worker for heavy calculations
self.addEventListener("message", (event: { data: WorkerRequest }) => {
  try {
    // Handle incoming messages
    switch (event.data.type) {
      case "generatePoints":
        generatePoints(event.data.payload);
        break;
      default:
        throw new AttractorError(
          `Unknown message type: ${event.data.type}`,
          "UNKNOWN_MESSAGE_TYPE"
        );
    }
  } catch (error) {
    const errorResponse: ErrorResponse = {
      type: "error",
      payload: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        code: error instanceof AttractorError ? error.code : "UNKNOWN_ERROR",
        stack: error instanceof Error ? error.stack : undefined,
      },
    };
    self.postMessage(errorResponse);
  }
});

function generatePoints(config: AttractorConfig): void {
  try {
    const startFlame = Flame(config.coefficients);
    const maxPointCount = config.pointCount;
    const maxPointValue = config.maxPointValue || 1e6;

    const points = new Float32Array(maxPointCount * 2);
    let pointCount = 0;
    let point: [number, number] = [0, 0];
    const bounds: Bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    const iterator = startFlame(point);
    const progressInterval = Math.max(100, Math.floor(maxPointCount / 100)); // Report progress every 1% or every 100 points, whichever is larger

    for (const [x, y] of iterator) {
      if (pointCount >= maxPointCount) {
        break;
      }

      // Validate point values
      if (Math.abs(x) > maxPointValue || Math.abs(y) > maxPointValue) {
        console.warn(`Point ${pointCount} exceeded max value: (${x}, ${y})`);
        continue;
      }

      points[pointCount * 2] = x;
      points[pointCount * 2 + 1] = y;

      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
      pointCount++;

      // Send progress updates
      if (pointCount % progressInterval === 0) {
        const progressResponse: ProgressResponse = {
          type: "progress",
          payload: {
            currentPoints: pointCount,
            totalPoints: maxPointCount,
            percentage: Math.round((pointCount / maxPointCount) * 100),
          },
        };
        self.postMessage(progressResponse);
      }
    }

    // Validate bounds
    if (
      !isFinite(bounds.minX) ||
      !isFinite(bounds.maxX) ||
      !isFinite(bounds.minY) ||
      !isFinite(bounds.maxY)
    ) {
      throw new AttractorError(
        "Invalid bounds calculated - no valid points generated",
        "INVALID_BOUNDS"
      );
    }

    // Send back the generated points
    const response: ResultsResponse = {
      type: "pointsGenerated",
      payload: {
        points,
        pointCount,
        bounds,
      },
    };
    self.postMessage(response);
  } catch (error) {
    throw new AttractorError(
      `Failed to generate points: ${error instanceof Error ? error.message : "Unknown error"}`,
      "POINT_GENERATION_FAILED"
    );
  }
}
