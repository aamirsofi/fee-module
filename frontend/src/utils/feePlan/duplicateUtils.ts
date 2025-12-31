/**
 * Duplicate Detection Utilities for Fee Plans
 */

export interface FeePlanIdentifier {
  feeCategoryId: number;
  categoryHeadId: number | null;
  classId: number | null;
}

export interface ExistingFeePlan {
  feeCategoryId: number;
  categoryHeadId?: number | null;
  classId?: number | null;
}

/**
 * Check if a fee plan combination matches an existing one
 */
export function isDuplicate(
  plan: FeePlanIdentifier,
  existing: ExistingFeePlan
): boolean {
  const matchesFeeCategory =
    existing.feeCategoryId === plan.feeCategoryId;
  const matchesCategoryHead =
    existing.categoryHeadId === plan.categoryHeadId ||
    (!existing.categoryHeadId && !plan.categoryHeadId);
  const matchesClass =
    existing.classId === plan.classId ||
    (!existing.classId && !plan.classId);

  return matchesFeeCategory && matchesCategoryHead && matchesClass;
}

/**
 * Filter out duplicate combinations from a list
 */
export function filterDuplicates<T extends FeePlanIdentifier>(
  combinations: T[],
  existingPlans: ExistingFeePlan[]
): T[] {
  return combinations.filter((combo) => {
    return !existingPlans.some((existing) => isDuplicate(combo, existing));
  });
}

/**
 * Find duplicate in existing plans
 */
export function findDuplicate(
  plan: FeePlanIdentifier,
  existingPlans: ExistingFeePlan[]
): ExistingFeePlan | undefined {
  return existingPlans.find((existing) => isDuplicate(plan, existing));
}

