type PaintValue = string | number | boolean | unknown[];

export interface LineLayerStyle {
  paint: Record<string, PaintValue>;
  layout?: Record<string, PaintValue>;
}

export interface CircleLayerStyle {
  paint: Record<string, PaintValue>;
  layout?: Record<string, PaintValue>;
}

export interface FillLayerStyle {
  paint: Record<string, PaintValue>;
  layout?: Record<string, PaintValue>;
}

export interface MapLibreEditingStyles {
  draftLine: LineLayerStyle;
  draftVertex: CircleLayerStyle;
  preview: {
    fill: FillLayerStyle;
    line: LineLayerStyle;
  };
  committed: {
    fill: FillLayerStyle;
    line: LineLayerStyle;
    circle: CircleLayerStyle;
  };
  selected: {
    fill: FillLayerStyle;
    line: LineLayerStyle;
    circle: CircleLayerStyle;
  };
  vertexHandle: CircleLayerStyle;
  midpointHandle: CircleLayerStyle;
  snapIndicator: {
    circle: CircleLayerStyle;
    line: LineLayerStyle;
  };
  poi: CircleLayerStyle;
  door: CircleLayerStyle;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type MapLibreEditingStyleOverrides = DeepPartial<MapLibreEditingStyles>;

export const DEFAULT_MAPLIBRE_EDITING_STYLES: MapLibreEditingStyles = {
  draftLine: {
    paint: {
      "line-color": "#2563EB",
      "line-width": 2,
      "line-opacity": 0.9
    }
  },
  draftVertex: {
    paint: {
      "circle-radius": 6,
      "circle-color": "#2563EB",
      "circle-opacity": 1,
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 2
    }
  },
  preview: {
    fill: {
      paint: {
        "fill-color": "#60A5FA",
        "fill-opacity": 0.22
      }
    },
    line: {
      paint: {
        "line-color": "#2563EB",
        "line-width": 2,
        "line-opacity": 0.9
      }
    }
  },
  committed: {
    fill: {
      paint: {
        "fill-color": "#99F6E4",
        "fill-opacity": 0.18
      }
    },
    line: {
      paint: {
        "line-color": "#0F766E",
        "line-width": 2,
        "line-opacity": 0.9
      }
    },
    circle: {
      paint: {
        "circle-radius": 6,
        "circle-color": "#99F6E4",
        "circle-opacity": 0.18,
        "circle-stroke-color": "#0F766E",
        "circle-stroke-width": 2,
        "circle-stroke-opacity": 0.9
      }
    }
  },
  selected: {
    fill: {
      paint: {
        "fill-color": "#F97316",
        "fill-opacity": 0.12
      }
    },
    line: {
      paint: {
        "line-color": "#F97316",
        "line-width": 3,
        "line-opacity": 1
      }
    },
    circle: {
      paint: {
        "circle-radius": 7,
        "circle-color": "#FFFFFF",
        "circle-opacity": 1,
        "circle-stroke-color": "#F97316",
        "circle-stroke-width": 3,
        "circle-stroke-opacity": 1
      }
    }
  },
  vertexHandle: {
    paint: {
      "circle-radius": 7,
      "circle-color": "#FFFFFF",
      "circle-opacity": 1,
      "circle-stroke-color": "#F97316",
      "circle-stroke-width": 2
    }
  },
  midpointHandle: {
    paint: {
      "circle-radius": 5,
      "circle-color": "#FFFFFF",
      "circle-opacity": 0.85,
      "circle-stroke-color": "#2563EB",
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.7
    }
  },
  snapIndicator: {
    circle: {
      paint: {
        "circle-radius": 8,
        "circle-color": "#22C55E",
        "circle-opacity": 0.25,
        "circle-stroke-color": "#22C55E",
        "circle-stroke-width": 2,
        "circle-stroke-opacity": 0.9
      }
    },
    line: {
      paint: {
        "line-color": "#22C55E",
        "line-width": 2,
        "line-opacity": 0.9
      }
    }
  },
  poi: {
    paint: {
      "circle-radius": 6,
      "circle-color": "#99F6E4",
      "circle-opacity": 0.18,
      "circle-stroke-color": "#0F766E",
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.9
    }
  },
  door: {
    paint: {
      "circle-radius": 6,
      "circle-color": "#99F6E4",
      "circle-opacity": 0.18,
      "circle-stroke-color": "#0F766E",
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.9
    }
  }
};

export function mergeMapLibreEditingStyles(
  overrides: MapLibreEditingStyleOverrides = {}
): MapLibreEditingStyles {
  return deepMerge(DEFAULT_MAPLIBRE_EDITING_STYLES, overrides);
}

function deepMerge<T>(base: T, overrides: DeepPartial<T> | undefined): T {
  if (!overrides) {
    return clone(base);
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    const baseValue = result[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      result[key] = deepMerge(baseValue, value as DeepPartial<typeof baseValue>);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

function clone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(clone) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, clone(child)])
    ) as T;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
