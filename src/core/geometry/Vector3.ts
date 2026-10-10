/**
 * BIMStudio — 3D Vector Mathematics
 *
 * Provides basic 3D coordinate operations for future CAD/BIM geometry.
 * Coordinates are represented as X, Y and Z numbers.
 */

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

function assertFiniteVector(vector: Vector3): void {
  if (
    !Number.isFinite(vector.x) ||
    !Number.isFinite(vector.y) ||
    !Number.isFinite(vector.z)
  ) {
    throw new Error("Vector coordinates must be finite numbers.");
  }
}

export function createVector3(
  x = 0,
  y = 0,
  z = 0
): Vector3 {
  const vector = { x, y, z };
  assertFiniteVector(vector);
  return vector;
}

export function addVectors(
  a: Vector3,
  b: Vector3
): Vector3 {
  assertFiniteVector(a);
  assertFiniteVector(b);

  return createVector3(
    a.x + b.x,
    a.y + b.y,
    a.z + b.z
  );
}

export function subtractVectors(
  a: Vector3,
  b: Vector3
): Vector3 {
  assertFiniteVector(a);
  assertFiniteVector(b);

  return createVector3(
    a.x - b.x,
    a.y - b.y,
    a.z - b.z
  );
}

export function scaleVector(
  vector: Vector3,
  scale: number
): Vector3 {
  assertFiniteVector(vector);

  if (!Number.isFinite(scale)) {
    throw new Error("Scale must be a finite number.");
  }

  return createVector3(
    vector.x * scale,
    vector.y * scale,
    vector.z * scale
  );
}

export function dotProduct(
  a: Vector3,
  b: Vector3
): number {
  assertFiniteVector(a);
  assertFiniteVector(b);

  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function crossProduct(
  a: Vector3,
  b: Vector3
): Vector3 {
  assertFiniteVector(a);
  assertFiniteVector(b);

  return createVector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

export function vectorLength(vector: Vector3): number {
  assertFiniteVector(vector);

  return Math.hypot(vector.x, vector.y, vector.z);
}

export function distanceBetween(
  a: Vector3,
  b: Vector3
): number {
  return vectorLength(subtractVectors(a, b));
}

export function normalizeVector(vector: Vector3): Vector3 {
  assertFiniteVector(vector);

  const length = vectorLength(vector);

  if (length === 0) {
    throw new Error("A zero-length vector cannot be normalized.");
  }

  return createVector3(
    vector.x / length,
    vector.y / length,
    vector.z / length
  );
}

export function vectorsAreEqual(
  a: Vector3,
  b: Vector3,
  tolerance = 1e-9
): boolean {
  assertFiniteVector(a);
  assertFiniteVector(b);

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be a non-negative finite number.");
  }

  return (
    Math.abs(a.x - b.x) <= tolerance &&
    Math.abs(a.y - b.y) <= tolerance &&
    Math.abs(a.z - b.z) <= tolerance
  );
}

export function lerpVector(
  a: Vector3,
  b: Vector3,
  t: number
): Vector3 {
  assertFiniteVector(a);
  assertFiniteVector(b);

  if (!Number.isFinite(t)) {
    throw new Error("Interpolation parameter must be finite.");
  }

  return createVector3(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t
  );
}
