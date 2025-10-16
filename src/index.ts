import { CanvasManager } from "./canvas";
import { AttractorConfig, GeneratePointsRequest, PointData, ProgressData } from "./types";
import { WorkerClient } from "./worker/worker-client";

const run = async () => {
  // Set up canvas with proper scaling
  const canvasManager = new CanvasManager("myCanvas");
  canvasManager.resizeCanvas();
  const context = canvasManager.context;
  const { width: canvasWidth, height: canvasHeight } =
    canvasManager.getDimensions();

  console.log("Starting worker...");
  const workerClient = new WorkerClient("./worker.js");

  const config: AttractorConfig = {
    coefficients: "MSSSRRPADDSO",
    pointCount: 400_000,
    burnInIterations: 100,
    maxPointValue: 1e6,
  };

  const { points, bounds, pointCount } = await workerClient.sendMessage<GeneratePointsRequest, PointData>(
    { type: "generatePoints", payload: config },
    (progress: ProgressData) => {
      console.log(
        `Progress: ${progress.percentage}% (${progress.currentPoints}/${progress.totalPoints} points)`
      );
    }
  );

  // Terminate the worker to free memory since we're done with it
  workerClient.terminate();

  console.log("Points generated:", pointCount);

  // Render points to canvas
  console.log("Rendering points...");
  const pixelDensities = new Float32Array(canvasWidth * canvasHeight);
  const minDimension = Math.min(canvasWidth, canvasHeight);
  const scaleX = minDimension / (bounds.maxX - bounds.minX);
  const scaleY = minDimension / (bounds.maxY - bounds.minY);
  let maxDensity = 0;
  for (let i = 0; i < pointCount; i++) {
    const x = points[i * 2];
    const y = points[i * 2 + 1];

    const canvasX = Math.floor((x - bounds.minX) * scaleX);
    const canvasY = Math.floor((y - bounds.minY) * scaleY);

    if (
      canvasX < 0 ||
      canvasX >= canvasWidth ||
      canvasY < 0 ||
      canvasY >= canvasHeight
    ) {
      continue;
    }

    pixelDensities[canvasY * canvasWidth + canvasX]++;
    maxDensity = Math.max(
      maxDensity,
      pixelDensities[canvasY * canvasWidth + canvasX]
    );
  }

  console.log("Max density:", maxDensity);
  const getColor = (t: number): [number, number, number] => {
    if (t < 0.5) {
      // dark orange → yellow
      const f = t / 0.5;
      return [255, Math.floor(100 + 155 * f), 0];
    } else {
      // yellow → white
      const f = (t - 0.5) / 0.5;
      return [255, 255, Math.floor(0 + 255 * f)];
    }
  };

  console.log("Drawing to canvas...");
  const imageData = context.createImageData(canvasWidth, canvasHeight);
  for (let i = 0; i < pixelDensities.length; i++) {
    const density = pixelDensities[i];
    if (density > 0) {
      const [r, g, b] = getColor(Math.pow(density / maxDensity, 0.5));
      imageData.data[i * 4] = r; // R
      imageData.data[i * 4 + 1] = g; // G
      imageData.data[i * 4 + 2] = b; // B
      imageData.data[i * 4 + 3] = 255; // A
    }
  }

  context.putImageData(imageData, 0, 0);
  console.log("Done.");
};

run().catch((error) => {
  console.error("Application error:", error);
});
