/**
 * Plan Name Generation Utilities
 */

export interface PlanNameComponents {
  feeCategoryName?: string;
  categoryHeadName?: string;
  className?: string;
}

/**
 * Generate fee plan name from components
 */
export function generatePlanName(
  components: PlanNameComponents
): string {
  const { feeCategoryName, categoryHeadName, className } = components;

  const baseName = feeCategoryName || "Fee Plan";
  const categoryHeadPart = categoryHeadName
    ? ` - ${categoryHeadName}`
    : "";
  const classPart = className ? ` (${className})` : "";

  return `${baseName}${categoryHeadPart}${classPart}`;
}

/**
 * Generate plan name from IDs (requires lookup arrays)
 */
export function generatePlanNameFromIds(
  feeCategoryId: number,
  categoryHeadId: number | null | undefined,
  classId: number | null | undefined,
  feeCategories: Array<{ id: number; name: string }>,
  categoryHeads: Array<{ id: number; name: string }>,
  classes: Array<{ id: number; name: string }>
): string {
  const feeCategory = feeCategories.find((cat) => cat.id === feeCategoryId);
  const categoryHead = categoryHeadId
    ? categoryHeads.find((ch) => ch.id === categoryHeadId)
    : null;
  const classItem = classId
    ? classes.find((cls) => cls.id === classId)
    : null;

  return generatePlanName({
    feeCategoryName: feeCategory?.name,
    categoryHeadName: categoryHead?.name,
    className: classItem?.name,
  });
}

