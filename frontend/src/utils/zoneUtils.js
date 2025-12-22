export const ZONE_BOUNDS = {
  standard: {
    1: { xMin: -8.5, yMin: 34, xMax: -2.833, yMax: 42 },
    2: { xMin: -2.833, yMin: 34, xMax: 2.833, yMax: 42 },
    3: { xMin: 2.833, yMin: 34, xMax: 8.5, yMax: 42 },
    4: { xMin: -8.5, yMin: 26, xMax: -2.833, yMax: 34 },
    5: { xMin: -2.833, yMin: 26, xMax: 2.833, yMax: 34 },
    6: { xMin: 2.833, yMin: 26, xMax: 8.5, yMax: 34 },
    7: { xMin: -8.5, yMin: 18, xMax: -2.833, yMax: 26 },
    8: { xMin: -2.833, yMin: 18, xMax: 2.833, yMax: 26 },
    9: { xMin: 2.833, yMin: 18, xMax: 8.5, yMax: 26 },
    11: { xMin: -14.167, yMin: 18, xMax: -8.5, yMax: 42 },
    12: { xMin: -8.5, yMin: 42, xMax: 8.5, yMax: 50 },
    13: { xMin: -8.5, yMin: 10, xMax: 8.5, yMax: 18 },
    14: { xMin: 8.5, yMin: 18, xMax: 14.167, yMax: 42 },
  },
  "rh-7-zone": {
    1: { xMin: -8.5, xMax: 8.5, yMin: 42, yMax: 46 },
    2: { xMin: -8.5 - 1.45, xMax: -8.5 + 1.45, yMin: 18, yMax: 42 },
    3: { xMin: -8.5, xMax: -2.833, yMin: 18, yMax: 26 },
    4: { xMin: -2.833, xMax: 2.833, yMin: 18, yMax: 26 },
    5: { xMin: -8.5, xMax: 8.5, yMin: 10, yMax: 18 },
    6: { xMin: 2.833, xMax: 8.5, yMin: 18, yMax: 26 },
    7: { xMin: 8.5 - 1.45, xMax: 8.5 + 1.45, yMin: 18, yMax: 42 },
  },
};

export const calculateZoneFromLocation = (x, y, zoneType = "standard") => {
  if (x === null || x === undefined || y === null || y === undefined) {
    return null;
  }

  const bounds = ZONE_BOUNDS[zoneType];
  if (!bounds) return null;

  for (const [zone, zoneBounds] of Object.entries(bounds)) {
    const { xMin, xMax, yMin, yMax } = zoneBounds;
    if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
      return parseInt(zone);
    }
  }

  return null;
};

export const isPitchInZone = (x, y, zone, zoneType = "standard") => {
  const bounds = ZONE_BOUNDS[zoneType]?.[zone];
  if (!bounds) return false;
  const { xMin, xMax, yMin, yMax } = bounds;
  return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
};

export const calculateZoneCenter = (zone, zoneType = "standard") => {
  const bounds = ZONE_BOUNDS[zoneType]?.[zone];
  if (!bounds) return { x: 0, y: 0 };
  const { xMin, xMax, yMin, yMax } = bounds;
  return {
    x: (xMin + xMax) / 2,
    y: (yMin + yMax) / 2,
  };
};

