export type Point2 = [number, number];

export type WorkerMessage<T> = {
  type: string,
  payload: T;
}