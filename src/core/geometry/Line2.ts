/**
 * BIMStudio — 2D Line Geometry
 *
 * Line-segment operations for CAD and architectural drawings.
 * Coordinates use the project's internal length unit: millimetres.
 */

import {
  createPoint2,
  distance2D,
  projectPointOnSegment,
  type Point2
} from "./Point2";

export type Line2 = {
  start: Point2;
  end: Point2;
};

export type LineIntersection =
  | { kind: "none" }
  | { kind: "point"; point: Point2 }
  | { kind: "overlap"; start: Point2; end: Point2 };

function validateLine(line: Line2): void {
  if (!line || !line.start || !line.end) {
    throw new Error("A line requires start and end points.");
  }

  for (const point of [line.start, line.end]) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error("Line coordinates must be finite numbers.");
    }
  }
}

function cross(
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  return ax * by - ay * bx;
}

function subtract(
  a: Point2,
  b: Point2
): Point2 {
  return createPoint2(a.x - b.x, a.y - b.y);
}

export function createLine2(
  start: Point2,
  end: Point2
): Line2 {
  const line = {
    start: createPoint2(start.x, start.y),
    end: createPoint2(end.x, end.y)
  };

  validateLine(line);
  return line;
}

export function lineLength(line: Line2): number {
  validateLine(line);
  return distance2D(line.start, line.end);
}

export function lineMidpoint(line: Line2): Point2 {
  validateLine(line);

  return createPoint2(
    (line.start.x + line.end.x) / 2,
    (line.start.y + line.end.y) / 2
  );
}

export function lineAngleRadians(line: Line2): number {
  validateLine(line);

  return Math.atan2(
    line.end.y - line.start.y,
    line.end.x - line.start.x
  );
}

export function closestPointOnLine(
  point: Point2,
  line: Line2
): Point2 {
  validateLine(line);

  return projectPointOnSegment(point, line.start, line.end);
}

export function distanceToLine(
  point: Point2,
  line: Line2
): number {
  return distance2D(point, closestPointOnLine(point, line));
}

/**
 * Finds the intersection of two finite line segments.
 *
 * A small tolerance is used for floating-point comparisons.
 * Collinear overlapping segments return their overlap interval.
 */
export function intersectLines(
  first: Line2,
  second: Line2,
  tolerance = 1e-9
): LineIntersection {
  validateLine(first);
  validateLine(second);

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be non-negative and finite.");
  }

  const p = first.start;
  const q = second.start;

  const r = subtract(first.end, first.start);
  const s = subtract(second.end, second.start);

  const rLength = Math.hypot(r.x, r.y);
  const sLength = Math.hypot(s.x, s.y);

  // Two point-segments.
  if (rLength <= tolerance && sLength <= tolerance) {
    return distance2D(p, q) <= tolerance
      ? { kind: "point", point: createPoint2(p.x, p.y) }
      : { kind: "none" };
  }

  // The first segment is a point.
  if (rLength <= tolerance) {
    const nearest = projectPointOnSegment(p, second.start, second.end);

    return distance2D(p, nearest) <= tolerance
      ? { kind: "point", point: nearest }
      : { kind: "none" };
  }

  // The second segment is a point.
  if (sLength <= tolerance) {
    const nearest = projectPointOnSegment(q, first.start, first.end);

    return distance2D(q, nearest) <= tolerance
      ? { kind: "point", point: nearest }
      : { kind: "none" };
  }

  const denominator = cross(r.x, r.y, s.x, s.y);
  const qMinusP = subtract(q, p);
  const parallelTolerance = tolerance * rLength * sLength;

  // Parallel segments.
  if (Math.abs(denominator) <= parallelTolerance) {
    const collinearMeasure = cross(
      qMinusP.x,
      qMinusP.y,
      r.x,
      r.y
    );

    if (Math.abs(collinearMeasure) > tolerance * rLength) {
      return { kind: "none" };
    }

    const rLengthSquared = r.x * r.x + r.y * r.y;

    const t0 =
      (qMinusP.x * r.x + qMinusP.y * r.y) /
      rLengthSquared;

    const t1 =
      t0 + (s.x * r.x + s.y * r.y) / rLengthSquared;

    const low = Math.max(0, Math.min(t0, t1));
    const high = Math.min(1, Math.max(t0, t1));

    const parameterTolerance = tolerance / rLength;

    if (high < low - parameterTolerance) {
      return { kind: "none" };
    }

    const overlapStart = createPoint2(
      p.x + low * r.x,
      p.y + low * r.y
    );

    const overlapEnd = createPoint2(
      p.x + high * r.x,
      p.y + high * r.y
    );

    if (distance2D(overlapStart, overlapEnd) <= tolerance) {
      return {
        kind: "point",
        point: overlapStart
      };
    }

    return {
      kind: "overlap",
      start: overlapStart,
      end: overlapEnd
    };
  }

  const t = cross(
    qMinusP.x,
    qMinusP.y,
    s.x,
    s.y
  ) / denominator;

  const u = cross(
    qMinusP.x,
    qMinusP.y,
    r.x,
    r.y
  ) / denominator;

  const tTolerance = tolerance / rLength;
  const uTolerance = tolerance / sLength;

  if (
    t < -tTolerance ||
    t > 1 + tTolerance ||
    u < -uTolerance ||
    u > 1 + uTolerance
  ) {
    return { kind: "none" };
  }

  const boundedT = Math.max(0, Math.min(1, t));

  return {
    kind: "point",
    point: createPoint2(
      p.x + boundedT * r.x,
      p.y + boundedT * r.y
    )
  };
    }
