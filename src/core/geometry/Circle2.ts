/**
 * BIMStudio — 2D Circle Geometry
 *
 * Circle calculations for CAD drawings and geometric operations.
 * Radius and coordinates use the internal unit, millimetres.
 */

import {
  createPoint2,
  distance2D,
  type Point2
} from "./Point2";

export type Circle2 = {
  center: Point2;
  radius: number;
};

export type CircleIntersection =
  | { kind: "none" }
  | { kind: "tangent"; points: [Point2] }
  | { kind: "intersect"; points: [Point2, Point2] }
  | { kind: "coincident" };

function validateCircle(circle: Circle2): void {
  if (!circle || !circle.center) {
    throw new Error("A circle requires a center point.");
  }

  if (
    !Number.isFinite(circle.center.x) ||
    !Number.isFinite(circle.center.y)
  ) {
    throw new Error("Circle center coordinates must be finite.");
  }

  if (!Number.isFinite(circle.radius) || circle.radius < 0) {
    throw new Error("Circle radius must be finite and non-negative.");
  }
}

function validateTolerance(tolerance: number): void {
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Tolerance must be finite and non-negative.");
  }
}

export function createCircle2(
  center: Point2,
  radius: number
): Circle2 {
  const circle = {
    center: createPoint2(center.x, center.y),
    radius
  };

  validateCircle(circle);
  return circle;
}

export function circleArea(circle: Circle2): number {
  validateCircle(circle);

  return Math.PI * circle.radius * circle.radius;
}

export function circleCircumference(circle: Circle2): number {
  validateCircle(circle);

  return 2 * Math.PI * circle.radius;
}

export function circleDiameter(circle: Circle2): number {
  validateCircle(circle);

  return 2 * circle.radius;
}

export function containsPointInCircle(
  circle: Circle2,
  point: Point2,
  includeBoundary = true,
  tolerance = 1e-9
): boolean {
  validateCircle(circle);
  validateTolerance(tolerance);

  const distance = distance2D(circle.center, point);

  return includeBoundary
    ? distance <= circle.radius + tolerance
    : distance < circle.radius - tolerance;
}

/**
 * Finds intersections between two circle circumferences.
 *
 * Tangent circles return one point.
 * Intersecting circles return two points.
 * Identical circumferences return "coincident".
 */
export function intersectCircles(
  first: Circle2,
  second: Circle2,
  tolerance = 1e-9
): CircleIntersection {
  validateCircle(first);
  validateCircle(second);
  validateTolerance(tolerance);

  const dx = second.center.x - first.center.x;
  const dy = second.center.y - first.center.y;
  const distance = Math.hypot(dx, dy);

  const r1 = first.radius;
  const r2 = second.radius;

  if (distance <= tolerance) {
    if (Math.abs(r1 - r2) <= tolerance) {
      return { kind: "coincident" };
    }

    return { kind: "none" };
  }

  if (distance > r1 + r2 + tolerance) {
    return { kind: "none" };
  }

  if (distance < Math.abs(r1 - r2) - tolerance) {
    return { kind: "none" };
  }

  // Distance from the first center to the chord midpoint.
  const along =
    (r1 * r1 - r2 * r2 + distance * distance) /
    (2 * distance);

  let heightSquared = r1 * r1 - along * along;

  // Account for tiny floating-point errors near tangency.
  if (heightSquared < -tolerance * Math.max(1, r1)) {
    return { kind: "none" };
  }

  heightSquared = Math.max(0, heightSquared);

  const height = Math.sqrt(heightSquared);

  const baseX = first.center.x + (along * dx) / distance;
  const baseY = first.center.y + (along * dy) / distance;

  const offsetX = (-dy * height) / distance;
  const offsetY = (dx * height) / distance;

  const pointA = createPoint2(
    baseX + offsetX,
    baseY + offsetY
  );

  if (height <= tolerance) {
    return {
      kind: "tangent",
      points: [pointA]
    };
  }

  const pointB = createPoint2(
    baseX - offsetX,
    baseY - offsetY
  );

  return {
    kind: "intersect",
    points: [pointA, pointB]
  };
}

/**
 * Returns a point on the circumference at an angle in radians.
 */
export function pointOnCircle(
  circle: Circle2,
  angleRadians: number
): Point2 {
  validateCircle(circle);

  if (!Number.isFinite(angleRadians)) {
    throw new Error("Angle must be a finite number.");
  }

  return createPoint2(
    circle.center.x + circle.radius * Math.cos(angleRadians),
    circle.center.y + circle.radius * Math.sin(angleRadians)
  );
}

/**
 * Returns the axis-aligned bounding box of the circle.
 */
export function circleBoundingBox(circle: Circle2): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  validateCircle(circle);

  const { x, y } = circle.center;
  const r = circle.radius;

  return {
    minX: x - r,
    minY: y - r,
    maxX: x + r,
    maxY: y + r,
    width: 2 * r,
    height: 2 * r
  };
                 }
