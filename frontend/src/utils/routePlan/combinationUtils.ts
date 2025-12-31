/**
 * Combination Generation Utilities for Route Plan Bulk Creation
 */

export interface RoutePlanCombination {
  routeId: number;
  feeCategoryId: number;
  categoryHeadId: number | null;
  classId: number;
}

/**
 * Generate all combinations from selected items
 */
export function generateRoutePlanCombinations(
  routeIds: number[],
  feeCategoryIds: number[],
  categoryHeadIds: number[],
  classIds: number[]
): RoutePlanCombination[] {
  const combinations: RoutePlanCombination[] = [];

  // If no category heads selected, include null (General)
  const categoryHeadIdsToUse =
    categoryHeadIds.length > 0 ? categoryHeadIds : [null];

  routeIds.forEach((routeId) => {
    feeCategoryIds.forEach((feeCategoryId) => {
      categoryHeadIdsToUse.forEach((categoryHeadId) => {
        classIds.forEach((classId) => {
          combinations.push({
            routeId,
            feeCategoryId,
            categoryHeadId,
            classId,
          });
        });
      });
    });
  });

  return combinations;
}

/**
 * Calculate total combinations that will be created
 */
export function calculateTotalRoutePlanCombinations(
  routeCount: number,
  feeCategoryCount: number,
  categoryHeadCount: number,
  classCount: number
): number {
  const effectiveCategoryHeadCount = categoryHeadCount > 0 ? categoryHeadCount : 1;
  return routeCount * feeCategoryCount * effectiveCategoryHeadCount * classCount;
}

