/**
 * BIMStudio — 2D Point Geometry
 *
 * Stores and calculates 2D drawing coordinates.
 * Coordinates use millimetres unless a caller converts them.
 */

export type Point2 = {
  x: number;
  y: number;
};

function validatePoint(point: Point2): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error("Point coordinates must be finite numbers.");
  }
}

export function createPoint2(x = 0, y = 0): Point2 {
  const point = { x, y };
  validatePoint(point);
  return point;
}

export function addPoints(a: Point2, b: Point2): Point2 {
  validatePoint(a);
  validatePoint(b);

  return createPoint2(a.x + b.x, a.y + b.y);
}

export function subtractPoints(a: Point2, b: Point2): Point2 {
  validatePoint(a);
  validatePoint(b);

  return createPoint2(a.x - b.x, a.y - b.y);
}

export function distance2D(a: Point2, b: Point2): number {
  validatePoint(a);
  validatePoint(b);

  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint2D(a: Point2, b: Point2): Point2 {
  validatePoint(a);
  validatePoint(b);

  return createPoint2(
    (a.x + b.x) / 2,
    (a.y + b.y) / 2
  );
}

export function translatePoint2(
  point: Point2,
  offsetX: number,
  offsetY: number
): Point2 {
  validatePoint(point);

  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
    throw new Error("Translation offsets must be finite numbers.");
  }

  return createPoint2(
    point.x + offsetX,
    point.y + offsetY
  );
}

export function rotatePoint2(
  point: Point2,
  angleRadians: number,
  origin: Point2 = createPoint2(0, 0)
): Point2 {
  validatePoint(point);
  validatePoint(origin);

  if (!Number.isFinite(angleRadians)) {
    throw new Error("Rotation angle must be finite.");
  }

  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const relativeX = point.x - origin.x;
  const relativeY = point.y - origin.y;

  return createPoint2(
    origin.x + relativeX * cos - relativeY * sin,
    origin.y + relativeX * sin + relativeY * cos
  );
}

export function pointsAreEqual(
  a: Point2,
  b: Point2,
  tolerance = 1e-9
): boolean {
  validatePoint(a);
  validatePoint(b);

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be a non-negative finite number.");
  }

  return (
    Math.abs(a.x - b.x) <= tolerance &&
    Math.abs(a.y - b.y) <= tolerance
  );
}

export function projectPointOnSegment(
  point: Point2,
  start: Point2,
  end: Point2
): Point2 {
  validatePoint(point);
  validatePoint(start);
  validatePoint(end);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return createPoint2(start.x, start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        lengthSquared
    )
  );

  return createPoint2(
    start.x + t * dx,
    start.y + t * dy
  );
      }
