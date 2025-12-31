/**
 * Name Resolution Utilities for Fee Plan
 * Resolves human-readable names to database IDs
 */

export interface LookupMaps {
  feeCategoryMap: Map<string, number>;
  categoryHeadMap: Map<string, number>;
  classMap: Map<string, number>;
}

export interface EntityWithName {
  name: string;
  id: number;
}

/**
 * Create lookup maps from entity arrays
 */
export function createLookupMaps(
  feeCategories: EntityWithName[],
  categoryHeads: EntityWithName[],
  classes: EntityWithName[]
): LookupMaps {
  const feeCategoryMap = new Map<string, number>();
  feeCategories.forEach((cat) => {
    feeCategoryMap.set(cat.name.toLowerCase().trim(), cat.id);
  });

  const categoryHeadMap = new Map<string, number>();
  categoryHeads.forEach((ch) => {
    categoryHeadMap.set(ch.name.toLowerCase().trim(), ch.id);
  });

  const classMap = new Map<string, number>();
  classes.forEach((cls) => {
    classMap.set(cls.name.toLowerCase().trim(), cls.id);
  });

  return { feeCategoryMap, categoryHeadMap, classMap };
}

/**
 * Resolve name or ID to ID
 */
export function resolveToId(
  value: string,
  lookupMap: Map<string, number>
): number | null {
  if (!value) return null;

  // Try as ID first
  const idMatch = parseInt(value);
  if (!isNaN(idMatch)) {
    return idMatch;
  }

  // Try as name
  return lookupMap.get(value.toLowerCase().trim()) || null;
}

/**
 * Resolve fee category name to ID
 */
export function resolveFeeCategoryId(
  nameOrId: string,
  lookupMap: Map<string, number>
): number | null {
  return resolveToId(nameOrId, lookupMap);
}

/**
 * Resolve category head name to ID (optional, can be null)
 */
export function resolveCategoryHeadId(
  nameOrId: string,
  lookupMap: Map<string, number>
): number | null {
  if (!nameOrId) return null;

  const lowerName = nameOrId.toLowerCase().trim();
  if (lowerName === "none" || lowerName === "general") {
    return null;
  }

  return resolveToId(nameOrId, lookupMap);
}

/**
 * Resolve class name to ID
 */
export function resolveClassId(
  nameOrId: string,
  lookupMap: Map<string, number>
): number | null {
  return resolveToId(nameOrId, lookupMap);
}

