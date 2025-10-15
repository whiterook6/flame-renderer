import { Point2 } from "./types";

export const Flame = (coefficients: string) => {
  // regex to match A-Y, 12 characters
  const regex = /^[A-Y]{12}$/;
  if (!regex.test(coefficients)) {
    throw new Error("Invalid attractor string");
  }
  const xCoefficients = Array.from(coefficients.slice(0, 6)).map(
    (ch) => -1.2 + (ch.charCodeAt(0) - 65) * 0.1
  ) as [number, number, number, number, number, number];
  const yCoefficients = Array.from(coefficients.slice(6, 12)).map(
    (ch) => -1.2 + (ch.charCodeAt(0) - 65) * 0.1
  ) as [number, number, number, number, number, number];
  
  const [a0, a1, a2, a3, a4, a5] = xCoefficients;
  const [b0, b1, b2, b3, b4, b5] = yCoefficients;

  const fn = (point: Point2): Point2 => {
    const [x, y] = point;

    const x2 = x * x;
    const xy = x * y;
    const y2 = y * y;

    return [
      a0 + a1 * x + a2 * x2 + a3 * xy + a4 * y + a5 * y2,
      b0 + b1 * x + b2 * x2 + b3 * xy + b4 * y + b5 * y2,
    ];
  };

  const isValidPoint = (point: Point2) => {
    return (
      Math.abs(point[0]) <= 1e6 &&
      Math.abs(point[1]) <= 1e6 &&
      !Number.isNaN(point[0]) &&
      !Number.isNaN(point[1])
    );
  }

  // Iterator generator
  function* iterator(start: Point2) {
    let point = start;
    for (let i = 0; i < 100; i++) {
      point = fn(point);
      if (!isValidPoint(point)) {
        return;
      }
    }

    while (true) {
      point = fn(point);

      if (!isValidPoint(point)) {
        return;
      }
      yield point;
    }
  }

  return iterator;
}