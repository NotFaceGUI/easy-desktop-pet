export interface WindowPoint {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FloatingLayoutSpec {
  key: string;
  desiredX: number;
  desiredY: number;
  width: number;
  height: number;
}

export interface FloatingLayoutResult {
  key: string;
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function distanceToBounds(point: WindowPoint, bounds: WindowBounds): number {
  const dx = Math.max(bounds.x - point.x, 0, point.x - (bounds.x + bounds.width));
  const dy = Math.max(bounds.y - point.y, 0, point.y - (bounds.y + bounds.height));
  return Math.hypot(dx, dy);
}

export function clampWindowPosition(
  position: WindowPoint,
  size: WindowSize,
  bounds: WindowBounds,
): WindowPoint {
  const maxX = bounds.x + Math.max(0, bounds.width - size.width);
  const maxY = bounds.y + Math.max(0, bounds.height - size.height);

  return {
    x: clamp(position.x, bounds.x, maxX),
    y: clamp(position.y, bounds.y, maxY),
  };
}

export function pickNearestBounds(
  position: WindowPoint,
  boundsList: WindowBounds[],
): WindowBounds | null {
  if (!boundsList.length) {
    return null;
  }

  return boundsList.reduce((nearest, bounds) => {
    if (!nearest) {
      return bounds;
    }

    const currentDistance = distanceToBounds(position, bounds);
    const nearestDistance = distanceToBounds(position, nearest);
    return currentDistance < nearestDistance ? bounds : nearest;
  }, boundsList[0] ?? null);
}

export function reconcileWindowPosition(
  position: WindowPoint,
  size: WindowSize,
  boundsList: WindowBounds[],
): WindowPoint {
  const bounds = pickNearestBounds(position, boundsList);
  if (!bounds) {
    return position;
  }

  return clampWindowPosition(position, size, bounds);
}

export function clampWindowPositionByRect(
  windowPosition: WindowPoint,
  rectInWindow: WindowRect,
  bounds: WindowBounds,
  scaleFactor: number,
  margin = 0,
): WindowPoint {
  const minLeft = bounds.x + margin;
  const minTop = bounds.y + margin;
  const maxRight = bounds.x + bounds.width - margin;
  const maxBottom = bounds.y + bounds.height - margin;

  const rectLeft = windowPosition.x + rectInWindow.left * scaleFactor;
  const rectTop = windowPosition.y + rectInWindow.top * scaleFactor;
  const rectRight = rectLeft + rectInWindow.width * scaleFactor;
  const rectBottom = rectTop + rectInWindow.height * scaleFactor;

  let nextX = windowPosition.x;
  let nextY = windowPosition.y;

  if (rectLeft < minLeft) {
    nextX += minLeft - rectLeft;
  } else if (rectRight > maxRight) {
    nextX -= rectRight - maxRight;
  }

  if (rectTop < minTop) {
    nextY += minTop - rectTop;
  } else if (rectBottom > maxBottom) {
    nextY -= rectBottom - maxBottom;
  }

  return { x: nextX, y: nextY };
}

export function reconcileWindowPositionByRect(
  windowPosition: WindowPoint,
  rectInWindow: WindowRect,
  boundsList: WindowBounds[],
  scaleFactor: number,
  margin = 0,
): WindowPoint {
  const rectCenter = {
    x: windowPosition.x + (rectInWindow.left + rectInWindow.width / 2) * scaleFactor,
    y: windowPosition.y + (rectInWindow.top + rectInWindow.height / 2) * scaleFactor,
  };
  const bounds = pickNearestBounds(rectCenter, boundsList);
  if (!bounds) {
    return windowPosition;
  }

  return clampWindowPositionByRect(windowPosition, rectInWindow, bounds, scaleFactor, margin);
}

function clampCenterToViewport(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  bounds: ViewportBounds,
  margin: number,
) {
  return {
    x: clamp(centerX, bounds.left + width / 2 + margin, bounds.right - width / 2 - margin),
    y: clamp(centerY, bounds.top + height / 2 + margin, bounds.bottom - height / 2 - margin),
  };
}

export function layoutFloatingButtons(
  specs: FloatingLayoutSpec[],
  bounds: ViewportBounds,
  margin = 12,
  spacing = 10,
): FloatingLayoutResult[] {
  const positions = specs.map((spec) => ({
    key: spec.key,
    width: spec.width,
    height: spec.height,
    ...clampCenterToViewport(spec.desiredX, spec.desiredY, spec.width, spec.height, bounds, margin),
  }));

  for (let iteration = 0; iteration < 8; iteration += 1) {
    let moved = false;

    for (let index = 0; index < positions.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < positions.length; compareIndex += 1) {
        const current = positions[index];
        const target = positions[compareIndex];
        const deltaX = target.x - current.x;
        const deltaY = target.y - current.y;
        const minDeltaX = (current.width + target.width) / 2 + spacing;
        const minDeltaY = (current.height + target.height) / 2 + spacing;

        if (Math.abs(deltaX) >= minDeltaX || Math.abs(deltaY) >= minDeltaY) {
          continue;
        }

        const overlapX = minDeltaX - Math.abs(deltaX);
        const overlapY = minDeltaY - Math.abs(deltaY);

        if (overlapX <= overlapY) {
          const direction =
            deltaX === 0
              ? index % 2 === 0
                ? -1
                : 1
              : Math.sign(deltaX);
          current.x -= (overlapX / 2) * direction;
          target.x += (overlapX / 2) * direction;
        } else {
          const direction =
            deltaY === 0
              ? index % 2 === 0
                ? -1
                : 1
              : Math.sign(deltaY);
          current.y -= (overlapY / 2) * direction;
          target.y += (overlapY / 2) * direction;
        }

        const clampedCurrent = clampCenterToViewport(
          current.x,
          current.y,
          current.width,
          current.height,
          bounds,
          margin,
        );
        current.x = clampedCurrent.x;
        current.y = clampedCurrent.y;

        const clampedTarget = clampCenterToViewport(
          target.x,
          target.y,
          target.width,
          target.height,
          bounds,
          margin,
        );
        target.x = clampedTarget.x;
        target.y = clampedTarget.y;
        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }

  return positions.map(({ key, x, y }) => ({ key, x, y }));
}
