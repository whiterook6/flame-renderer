import { WorkerMessage } from "./types";

const run = async () => {
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Cannot get canvas");
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot get canvas context");
  }
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  context.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all drawing

  console.log("Starting worker...");
  const {
    points,
    bounds,
    pointCount,
  } = await new Promise<{
    points: Float32Array,
    bounds: {
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
    },
    pointCount: number,
  }>((resolve, reject) => {
    const worker = new Worker("./worker.js");
    const messageToWorker: WorkerMessage<{
      attractor: string;
      points: number;
    }> = {
      type: "lyapunov",
      payload: {
        attractor: "MSSSRRPADDSO",
        points: 100_000,
      },
    }
    worker.postMessage(messageToWorker);
    worker.onmessage = (event: {
      type: string;
      data: WorkerMessage<{
        points: Float32Array,
        pointCount: number,
        bounds: {
          minX: number,
          maxX: number,
          minY: number,
          maxY: number,
        }
      }>
    }) => {
      resolve(event.data.payload);
    };
    worker.onerror = (error) => {
      reject(error);
    };
  });

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

    if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) {
      continue;
    }

    pixelDensities[canvasY * canvas.width + canvasX]++;
    maxDensity = Math.max(maxDensity, pixelDensities[canvasY * canvas.width + canvasX]);
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
      const [r, g, b] = getColor(
        Math.pow(density / maxDensity, 0.5)
      );
      imageData.data[i * 4] = r; // R
      imageData.data[i * 4 + 1] = g; // G
      imageData.data[i * 4 + 2] = b; // B
      imageData.data[i * 4 + 3] = 255; // A
    }
  }

  context.putImageData(imageData, 0, 0);
  console.log("Done.");
};

run();
