// Web Worker type declarations
declare global {
  interface Worker {
    postMessage(message: any): void;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
    onmessageerror: ((event: MessageEvent) => void) | null;
  }

  interface MessageEvent<T = any> {
    data: T;
  }

  interface ErrorEvent {
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    error?: Error;
  }
}

export type Point2 = [number, number];

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface AttractorConfig {
  coefficients: string;
  pointCount: number;
  burnInIterations?: number;
  maxPointValue?: number;
}

export interface PointData {
  points: Float32Array;
  pointCount: number;
  bounds: Bounds;
}

export interface WorkerRequest {
  type: "generatePoints";
  payload: AttractorConfig;
}

export interface WorkerResponse {
  type: "pointsGenerated" | "error";
  payload: PointData | ErrorData;
}

export interface ErrorData {
  message: string;
  code: string;
  stack?: string;
}

export type WorkerMessage = WorkerRequest | WorkerResponse;

// Error classes
export class AttractorError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AttractorError";
  }
}

export class CanvasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanvasError";
  }
}

export class WorkerError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "WorkerError";
  }
}
