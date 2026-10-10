/**
 * BIMStudio — 2D Transformations
 * Supports translation, rotation, scaling and transform composition.
 */

import { createPoint2, type Point2 } from "./Point2";

export type Transform2 = {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
};

function validateTransform(transform: Transform2): void {
  const values = [
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.tx,
    transform.ty,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error("Transform values must all be finite numbers.");
  }
}

function validatePoint(point: Point2): void {
  if (
    !point ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y)
  ) {
    throw new Error("Point coordinates must be finite numbers.");
  }
}

/** Create an identity transform that leaves points unchanged. */
export function identityTransform2(): Transform2 {
  return {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: 0,
    ty: 0,
  };
}

/** Create a translation transform. */
export function translationTransform2(
  x: number,
  y: number
): Transform2 {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("Translation values must be finite.");
  }

  return {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: x,
    ty: y,
  };
}

/** Create a rotation transform around the origin. */
export function rotationTransform2(
  angleRadians: number
): Transform2 {
  if (!Number.isFinite(angleRadians)) {
    throw new Error("Rotation angle must be finite.");
  }

  const cosine = Math.cos(angleRadians);
  const sine = Math.sin(angleRadians);

  return {
    a: cosine,
    b: sine,
    c: -sine,
    d: cosine,
    tx: 0,
    ty: 0,
  };
}

/** Create a scaling transform. Negative values mirror an axis. */
export function scalingTransform2(
  scaleX: number,
  scaleY: number = scaleX
): Transform2 {
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) {
    throw new Error("Scale values must be finite.");
  }

  return {
    a: scaleX,
    b: 0,
    c: 0,
    d: scaleY,
    tx: 0,
    ty: 0,
  };
}

/** Create a transform that rotates around a specific point. */
export function rotationAroundPoint2(
  center: Point2,
  angleRadians: number
): Transform2 {
  validatePoint(center);

  if (!Number.isFinite(angleRadians)) {
    throw new Error("Rotation angle must be finite.");
  }

  const cosine = Math.cos(angleRadians);
  const sine = Math.sin(angleRadians);

  return {
    a: cosine,
    b: sine,
    c: -sine,
    d: cosine,
    tx: center.x - cosine * center.x + sine * center.y,
    ty: center.y - sine * center.x - cosine * center.y,
  };
}

/** Apply a transform to a point. */
export function applyTransform2(
  point: Point2,
  transform: Transform2
): Point2 {
  validatePoint(point);
  validateTransform(transform);

  return createPoint2(
    transform.a * point.x +
      transform.c * point.y +
      transform.tx,
    transform.b * point.x +
      transform.d * point.y +
      transform.ty
  );
}

/**
 * Compose two transforms.
 * The returned transform applies `first`, then `second`.
 */
export function composeTransforms2(
  first: Transform2,
  second: Transform2
): Transform2 {
  validateTransform(first);
  validateTransform(second);

  return {
    a: second.a * first.a + second.c * first.b,
    b: second.b * first.a + second.d * first.b,
    c: second.a * first.c + second.c * first.d,
    d: second.b * first.c + second.d * first.d,
    tx:
      second.a * first.tx +
      second.c * first.ty +
      second.tx,
    ty:
      second.b * first.tx +
      second.d * first.ty +
      second.ty,
  };
}

/** Return the inverse transform, if one exists. */
export function invertTransform2(
  transform: Transform2
): Transform2 {
  validateTransform(transform);

  const determinant =
    transform.a * transform.d -
    transform.b * transform.c;

  if (Math.abs(determinant) < 1e-12) {
    throw new Error(
      "Transform cannot be inverted because its matrix is singular."
    );
  }

  const inverseA = transform.d / determinant;
  const inverseB = -transform.b / determinant;
  const inverseC = -transform.c / determinant;
  const inverseD = transform.a / determinant;

  return {
    a: inverseA,
    b: inverseB,
    c: inverseC,
    d: inverseD,
    tx: -(inverseA * transform.tx + inverseC * transform.ty),
    ty: -(inverseB * transform.tx + inverseD * transform.ty),
  };
}

/** Check whether two transforms are approximately equal. */
export function transformsAreEqual(
  first: Transform2,
  second: Transform2,
  tolerance = 1e-9
): boolean {
  validateTransform(first);
  validateTransform(second);

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be finite and non-negative.");
  }

  return (
    Math.abs(first.a - second.a) <= tolerance &&
    Math.abs(first.b - second.b) <= tolerance &&
    Math.abs(first.c - second.c) <= tolerance &&
    Math.abs(first.d - second.d) <= tolerance &&
    Math.abs(first.tx - second.tx) <= tolerance &&
    Math.abs(first.ty - second.ty) <= tolerance
  );
}

/** Transform an array of points. */
export function transformPoints2(
  points: Point2[],
  transform: Transform2
): Point2[] {
  validateTransform(transform);

  return points.map((point) => applyTransform2(point, transform));
      }
