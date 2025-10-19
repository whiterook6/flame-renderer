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
   * Sets the canvas internal resolution to match its display size
   */
  resizeCanvas(): void {
    // Recalculate DPR in case it changed (e.g., moving between displays)
    this.dpr = window.devicePixelRatio || 1;
    
    // Get the actual display size of the canvas (as sized by CSS)
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Set the internal canvas resolution to match display size * DPR
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;

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
