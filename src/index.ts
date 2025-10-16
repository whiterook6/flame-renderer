import {
  WorkerRequest,
  WorkerResponse,
  AttractorConfig,
  PointData,
  ErrorData,
  CanvasError,
  WorkerError,
} from "./types";

const run = async () => {
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new CanvasError("Cannot get canvas element");
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new CanvasError("Cannot get canvas 2D context");
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  context.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all drawing

  console.log("Starting worker...");
  const { points, bounds, pointCount } = await new Promise<PointData>(
    (resolve, reject) => {
      const worker = new Worker("./worker.js") as Worker;
      const config: AttractorConfig = {
        coefficients: "MSSSRRPADDSO",
        pointCount: 400_000,
        burnInIterations: 100,
        maxPointValue: 1e6,
      };

      const messageToWorker: WorkerRequest = {
        type: "generatePoints",
        payload: config,
      };

      worker.postMessage(messageToWorker);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;

        if (response.type === "pointsGenerated") {
          resolve(response.payload as PointData);
        } else if (response.type === "error") {
          const errorData = response.payload as ErrorData;
          reject(new WorkerError(errorData.message, errorData.code));
        } else {
          reject(
            new WorkerError(
              `Unknown response type: ${response.type}`,
              "UNKNOWN_RESPONSE_TYPE"
            )
          );
        }
      };

      worker.onerror = (error) => {
        reject(
          new WorkerError(`Worker error: ${error.message}`, "WORKER_ERROR")
        );
      };

      worker.onmessageerror = (error) => {
        reject(
          new WorkerError(
            `Worker message error: ${error}`,
            "WORKER_MESSAGE_ERROR"
          )
        );
      };
    }
  );

  console.log("Points generated:", pointCount);

  // Render points to canvas
  console.log("Rendering points...");
  const pixelDensities = new Float32Array(canvas.width * canvas.height);
  const minDimension = Math.min(canvas.width, canvas.height);
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
      canvasX >= canvas.width ||
      canvasY < 0 ||
      canvasY >= canvas.height
    ) {
      continue;
    }

    pixelDensities[canvasY * canvas.width + canvasX]++;
    maxDensity = Math.max(
      maxDensity,
      pixelDensities[canvasY * canvas.width + canvasX]
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
  const imageData = context.createImageData(canvas.width, canvas.height);
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
