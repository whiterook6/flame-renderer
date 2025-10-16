import { CanvasError } from "../types";

export interface CanvasDimensions {
  width: number;
  height: number;
}

export class CanvasManager {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  dpr: number;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new CanvasError(`Cannot get canvas element with id: ${canvasId}`);
    }

    const context = canvas.getContext("2d");
    if (!context) {
      throw new CanvasError("Cannot get canvas 2D context");
    }

    this.canvas = canvas;
    this.context = context;
    this.dpr = window.devicePixelRatio || 1;
  }

  /**
   * Gets the current canvas dimensions in pixels
   */
  getDimensions(): CanvasDimensions {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * Resizes the canvas to match the current window size
   */
  resizeCanvas(): void {
    const { innerWidth: width, innerHeight: height } = window;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    // Scale all drawing operations by the device pixel ratio
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Clears the entire canvas
   */
  clearCanvas(): void {
    const { width, height } = this.getDimensions();
    this.context.clearRect(0, 0, width, height);
  }
}
