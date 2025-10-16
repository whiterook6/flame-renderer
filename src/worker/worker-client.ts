import {
  AttractorConfig,
  PointData,
  ProgressData,
  WorkerError,
  WorkerRequest,
  WorkerResponse
} from "../types";

export interface Job<TRequest extends WorkerRequest, TResult> {
  id: string;
  request: TRequest;
  resolve: (value: TResult) => void;
  reject: (error: WorkerError) => void;
  onProgress?: (progress: ProgressData) => void;
}

export class WorkerClient {
  private worker: Worker | null = null;
  private currentJob: Job<any, any> | null = null;
  private jobQueue: Job<any, any>[] = [];
  private isProcessing = false;

  constructor(private workerPath: string) {}

  /**
   * Generic method to send a message to the worker and handle the response
   * 
   * @example
   * // Send a generatePoints request
   * const result = await workerClient.sendMessage(
   *   { type: "generatePoints", payload: config },
   *   (progress) => console.log(`Progress: ${progress.percentage}%`)
   * );
   * 
   * @param request - The message to send to the worker
   * @param onProgress - Optional callback for progress updates
   * @returns Promise that resolves with the worker's response
   */
  async sendMessage<TRequest extends WorkerRequest, TResult>(
    request: TRequest,
    onProgress?: (progress: ProgressData) => void
  ): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const job: Job<TRequest, TResult> = {
        id: this.generateJobId(),
        request,
        resolve,
        reject,
        onProgress,
      };

      this.jobQueue.push(job);
      this.processNextJob();
    });
  }

  /**
   * Convenience method for point generation
   */
  async generatePoints(
    config: AttractorConfig,
    onProgress?: (progress: ProgressData) => void
  ): Promise<PointData> {
    return this.sendMessage(
      { type: "generatePoints", payload: config },
      onProgress
    );
  }

  /**
   * Terminates the worker and clears all pending jobs
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending jobs
    const allJobs = [this.currentJob, ...this.jobQueue].filter(
      Boolean
    ) as Job<any, any>[];
    allJobs.forEach((job) => {
      job.reject(new WorkerError("Worker terminated", "WORKER_TERMINATED"));
    });

    this.currentJob = null;
    this.jobQueue = [];
    this.isProcessing = false;
  }

  /**
   * Gets the current job queue length
   */
  getQueueLength(): number {
    return this.jobQueue.length + (this.currentJob ? 1 : 0);
  }

  /**
   * Checks if the worker is currently processing a job
   */
  isBusy(): boolean {
    return this.isProcessing;
  }

  private async processNextJob(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.currentJob = this.jobQueue.shift()!;

    try {
      await this.executeJob(this.currentJob);
    } catch (error) {
      this.currentJob.reject(
        error instanceof WorkerError
          ? error
          : new WorkerError(
              error instanceof Error ? error.message : "Unknown error",
              "JOB_EXECUTION_FAILED"
            )
      );
    } finally {
      this.currentJob = null;
      this.isProcessing = false;

      // Process next job if any
      if (this.jobQueue.length > 0) {
        this.processNextJob();
      }
    }
  }

  private async executeJob(job: Job<any, any>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Create worker if needed
      if (!this.worker) {
        this.worker = new Worker(this.workerPath);
        this.setupWorkerEventHandlers();
      }

      const messageToWorker = job.request;

      // Set up one-time handlers for this job
      const cleanup = () => {
        if (this.worker) {
          this.worker.onmessage = null;
          this.worker.onerror = null;
          this.worker.onmessageerror = null;
        }
      };

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        let error: WorkerError;

        switch (response.type) {
          case "pointsGenerated":
            cleanup();
            // For now, we assume all successful responses return PointData
            // In the future, this could be made more generic with response type mapping
            job.resolve(response.payload as any);
            resolve();
            break;

          case "progress":
            if (job.onProgress) {
              job.onProgress(response.payload);
            }
            break;

          case "error":
            cleanup();
            error = new WorkerError(
              response.payload.message,
              response.payload.code
            );
            job.reject(error);
            reject(error);
            break;

          default:
            cleanup();
            error = new WorkerError(
              `Unknown response type: ${(response as WorkerResponse).type}`,
              "UNKNOWN_RESPONSE_TYPE"
            );
            job.reject(error);
            reject(error);
        }
      };

      this.worker.onerror = (error) => {
        cleanup();
        const workerError = new WorkerError(
          `Worker error: ${error.message}`,
          "WORKER_ERROR"
        );
        job.reject(workerError);
        reject(workerError);
      };

      this.worker.onmessageerror = (error) => {
        cleanup();
        const workerError = new WorkerError(
          error instanceof ErrorEvent ? error.message : "Message parsing failed",
          "WORKER_MESSAGE_ERROR"
        );
        job.reject(workerError);
        reject(workerError);
      };

      // Send the job to the worker
      this.worker.postMessage(messageToWorker);
    });
  }

  private setupWorkerEventHandlers(): void {
    // These will be overridden per job, but we need them for the initial setup
    if (this.worker) {
      this.worker.onmessage = () => {};
      this.worker.onerror = () => {};
      this.worker.onmessageerror = () => {};
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
