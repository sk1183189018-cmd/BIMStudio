/**
 * BIMStudio — 2D Polygon Geometry
 *
 * Provides polygon validation, area, perimeter, centroid,
 * point containment, and bounding-box calculations.
 *
 * Coordinates use millimetres by default.
 */

import {
  createPoint2,
  distance2D,
  type Point2
} from "./Point2";

export type Polygon2 = {
  vertices: Point2[];
};

export type BoundingBox2 = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

const DEFAULT_TOLERANCE = 1e-9;

function validatePoint(point: Point2): void {
  if (
    !point ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y)
  ) {
    throw new Error("Polygon coordinates must be finite numbers.");
  }
}

function validatePolygon(polygon: Polygon2): void {
  if (!polygon || !Array.isArray(polygon.vertices)) {
    throw new Error("A polygon must contain a vertices array.");
  }

  if (polygon.vertices.length < 3) {
    throw new Error("A polygon requires at least three vertices.");
  }

  polygon.vertices.forEach(validatePoint);
}

function cross(
  a: Point2,
  b: Point2,
  c: Point2
): number {
  return (
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x)
  );
}

export function createPolygon2(vertices: Point2[]): Polygon2 {
  if (!Array.isArray(vertices) || vertices.length < 3) {
    throw new Error("Provide at least three polygon vertices.");
  }

  const copied = vertices.map((point) =>
    createPoint2(point.x, point.y)
  );

  const first = copied[0];
  const last = copied[copied.length - 1];

  // Remove a repeated closing vertex; the polygon closes automatically.
  if (distance2D(first, last) <= DEFAULT_TOLERANCE) {
    copied.pop();
  }

  if (copied.length < 3) {
    throw new Error("A polygon requires at least three distinct vertices.");
  }

  const polygon = { vertices: copied };
  validatePolygon(polygon);

  if (Math.abs(signedArea(polygon)) <= DEFAULT_TOLERANCE) {
    throw new Error("Polygon area must be greater than zero.");
  }

  return polygon;
}

/**
 * Signed area:
 * positive = counter-clockwise vertex order
 * negative = clockwise vertex order
 */
export function signedArea(polygon: Polygon2): number {
  validatePolygon(polygon);

  let twiceArea = 0;
  const vertices = polygon.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    twiceArea += current.x * next.y - next.x * current.y;
  }

  return twiceArea / 2;
}

export function polygonArea(polygon: Polygon2): number {
  return Math.abs(signedArea(polygon));
}

export function polygonPerimeter(polygon: Polygon2): number {
  validatePolygon(polygon);

  let perimeter = 0;
  const vertices = polygon.vertices;

  for (let i = 0; i < vertices.length; i++) {
    perimeter += distance2D(
      vertices[i],
      vertices[(i + 1) % vertices.length]
    );
  }

  return perimeter;
}

export function polygonCentroid(polygon: Polygon2): Point2 {
  validatePolygon(polygon);

  const vertices = polygon.vertices;
  let twiceArea = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    const factor =
      current.x * next.y - next.x * current.y;

    twiceArea += factor;
    centroidX += (current.x + next.x) * factor;
    centroidY += (current.y + next.y) * factor;
  }

  if (Math.abs(twiceArea) <= DEFAULT_TOLERANCE) {
    throw new Error("Cannot calculate centroid of a zero-area polygon.");
  }

  return createPoint2(
    centroidX / (3 * twiceArea),
    centroidY / (3 * twiceArea)
  );
}

export function polygonBoundingBox(
  polygon: Polygon2
): BoundingBox2 {
  validatePolygon(polygon);

  const xs = polygon.vertices.map((point) => point.x);
  const ys = polygon.vertices.map((point) => point.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Returns true for points inside the polygon.
 * Boundary points are included by default.
 */
export function containsPoint(
  polygon: Polygon2,
  point: Point2,
  includeBoundary = true,
  tolerance = DEFAULT_TOLERANCE
): boolean {
  validatePolygon(polygon);
  validatePoint(point);

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be non-negative and finite.");
  }

  const vertices = polygon.vertices;
  let inside = false;

  for (let i = 0, j = vertices.length - 1;
    i < vertices.length;
    j = i++
  ) {
    const a = vertices[j];
    const b = vertices[i];

    const areaMeasure = cross(a, b, point);
    const withinX =
      point.x >= Math.min(a.x, b.x) - tolerance &&
      point.x <= Math.max(a.x, b.x) + tolerance;
    const withinY =
      point.y >= Math.min(a.y, b.y) - tolerance &&
      point.y <= Math.max(a.y, b.y) + tolerance;

    const segmentLength = distance2D(a, b);

    if (
      includeBoundary &&
      Math.abs(areaMeasure) <= tolerance * Math.max(1, segmentLength) &&
      withinX &&
      withinY
    ) {
      return true;
    }

    const crossesRay =
      (a.y > point.y) !== (b.y > point.y) &&
      point.x <
        ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (crossesRay) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Reverse the vertex order without changing the shape.
 */
export function reversePolygon(polygon: Polygon2): Polygon2 {
  validatePolygon(polygon);

  return {
    vertices: [...polygon.vertices]
      .reverse()
      .map((point) => createPoint2(point.x, point.y))
  };
}

/**
 * Returns a copy with counter-clockwise vertex order.
 */
export function ensureCounterClockwise(
  polygon: Polygon2
): Polygon2 {
  validatePolygon(polygon);

  return signedArea(polygon) < 0
    ? reversePolygon(polygon)
    : {
        vertices: polygon.vertices.map((point) =>
          createPoint2(point.x, point.y)
        )
      };
}
