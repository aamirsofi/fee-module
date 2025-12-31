/**
 * Combination Generation Utilities for Bulk Creation
 */

export interface Combination {
  feeCategoryId: number;
  categoryHeadId: number | null;
  classId: number;
}

/**
 * Generate all combinations from selected items
 */
export function generateCombinations(
  feeCategoryIds: number[],
  categoryHeadIds: number[],
  classIds: number[]
): Combination[] {
  const combinations: Combination[] = [];

  // If no category heads selected, include null (General)
  const categoryHeadIdsToUse =
    categoryHeadIds.length > 0 ? categoryHeadIds : [null];

  feeCategoryIds.forEach((feeCategoryId) => {
    categoryHeadIdsToUse.forEach((categoryHeadId) => {
      classIds.forEach((classId) => {
        combinations.push({
          feeCategoryId,
          categoryHeadId,
          classId,
        });
      });
    });
  });

  return combinations;
}

/**
 * Calculate total combinations that will be created
 */
export function calculateTotalCombinations(
  feeCategoryCount: number,
  categoryHeadCount: number,
  classCount: number
): number {
  const effectiveCategoryHeadCount = categoryHeadCount > 0 ? categoryHeadCount : 1;
  return feeCategoryCount * effectiveCategoryHeadCount * classCount;
}

