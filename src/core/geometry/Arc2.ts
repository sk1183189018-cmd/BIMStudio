/**
 * BIMStudio — 2D Arc Geometry
 * Arc angles are measured in radians.
 * Coordinates and radius use millimetres.
 */

import { createPoint2, type Point2 } from "./Point2";
import { createCircle2, pointOnCircle, type Circle2 } from "./Circle2";

export type Arc2 = {
  center: Point2;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
};

const TAU = Math.PI * 2;

function validateArc(arc: Arc2): void {
  if (!arc || !arc.center) {
    throw new Error("An arc requires a center point.");
  }

  if (
    !Number.isFinite(arc.center.x) ||
    !Number.isFinite(arc.center.y)
  ) {
    throw new Error("Arc center coordinates must be finite.");
  }

  if (!Number.isFinite(arc.radius) || arc.radius < 0) {
    throw new Error("Arc radius must be finite and non-negative.");
  }

  if (
    !Number.isFinite(arc.startAngle) ||
    !Number.isFinite(arc.endAngle)
  ) {
    throw new Error("Arc angles must be finite.");
  }

  if (typeof arc.clockwise !== "boolean") {
    throw new Error("Arc direction must be specified.");
  }
}

export function createArc2(
  center: Point2,
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise = false
): Arc2 {
  const arc: Arc2 = {
    center: createPoint2(center.x, center.y),
    radius,
    startAngle,
    endAngle,
    clockwise,
  };

  validateArc(arc);
  return arc;
}

/** Normalize an angle to the range [0, 2π). */
export function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    throw new Error("Angle must be finite.");
  }

  return ((angle % TAU) + TAU) % TAU;
}

/** Calculate the swept angle in the specified direction. */
export function arcSweepAngle(arc: Arc2): number {
  validateArc(arc);

  const start = normalizeAngle(arc.startAngle);
  const end = normalizeAngle(arc.endAngle);

  if (arc.clockwise) {
    return (start - end + TAU) % TAU;
  }

  return (end - start + TAU) % TAU;
}

/** Length measured along the arc. */
export function arcLength(arc: Arc2): number {
  validateArc(arc);
  return arc.radius * arcSweepAngle(arc);
}

/** Straight-line distance between the arc endpoints. */
export function arcChordLength(arc: Arc2): number {
  validateArc(arc);

  const sweep = arcSweepAngle(arc);
  return 2 * arc.radius * Math.sin(sweep / 2);
}

/** Calculate the angle halfway along the arc. */
export function arcMidAngle(arc: Arc2): number {
  validateArc(arc);

  const sweep = arcSweepAngle(arc);
  const direction = arc.clockwise ? -1 : 1;

  return normalizeAngle(
    arc.startAngle + direction * sweep / 2
  );
}

/** Return the start point of the arc. */
export function arcStartPoint(arc: Arc2): Point2 {
  validateArc(arc);

  const circle: Circle2 = createCircle2(arc.center, arc.radius);
  return pointOnCircle(circle, arc.startAngle);
}

/** Return the end point of the arc. */
export function arcEndPoint(arc: Arc2): Point2 {
  validateArc(arc);

  const circle: Circle2 = createCircle2(arc.center, arc.radius);
  return pointOnCircle(circle, arc.endAngle);
}

/** Return the point halfway along the arc. */
export function arcMidPoint(arc: Arc2): Point2 {
  validateArc(arc);

  const circle: Circle2 = createCircle2(arc.center, arc.radius);
  return pointOnCircle(circle, arcMidAngle(arc));
}

/**
 * Check whether an angle lies on the swept arc.
 * Angles are compared with a tolerance in radians.
 */
export function arcContainsAngle(
  arc: Arc2,
  angle: number,
  tolerance = 1e-9
): boolean {
  validateArc(arc);

  if (!Number.isFinite(angle)) {
    throw new Error("Angle must be finite.");
  }

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be non-negative and finite.");
  }

  const sweep = arcSweepAngle(arc);
  const start = normalizeAngle(arc.startAngle);
  const target = normalizeAngle(angle);

  const travelled = arc.clockwise
    ? normalizeAngle(start - target)
    : normalizeAngle(target - start);

  return travelled <= sweep + tolerance;
}

/** Convert the arc to a sequence of points for drawing. */
export function tessellateArc(
  arc: Arc2,
  segments = 32
): Point2[] {
  validateArc(arc);

  if (!Number.isInteger(segments) || segments < 1 || segments > 10000) {
    throw new Error("Segments must be an integer from 1 to 10000.");
  }

  const sweep = arcSweepAngle(arc);
  const direction = arc.clockwise ? -1 : 1;
  const circle = createCircle2(arc.center, arc.radius);
  const points: Point2[] = [];

  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments;
    const angle =
      arc.startAngle + direction * sweep * fraction;

    points.push(pointOnCircle(circle, angle));
  }

  return points;
}

/** Axis-aligned bounding box calculated from sampled arc points. */
export function arcBoundingBox(
  arc: Arc2,
  segments = 128
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const points = tessellateArc(arc, segments);

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

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
    height: maxY - minY,
  };
}
