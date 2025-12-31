/**
 * Route Plan Name Generation Utilities
 */

export interface RoutePlanNameComponents {
  routeName?: string;
  feeCategoryName?: string;
  categoryHeadName?: string;
  className?: string;
}

/**
 * Generate route plan name from components
 */
export function generateRoutePlanName(
  components: RoutePlanNameComponents
): string {
  const { routeName, feeCategoryName, categoryHeadName, className } = components;

  const baseName = routeName || "Route Plan";
  const feeCategoryPart = feeCategoryName ? ` - ${feeCategoryName}` : "";
  const categoryHeadPart = categoryHeadName ? ` - ${categoryHeadName}` : "";
  const classPart = className ? ` (${className})` : "";

  return `${baseName}${feeCategoryPart}${categoryHeadPart}${classPart}`;
}

/**
 * Generate route plan name from IDs (requires lookup arrays)
 */
export function generateRoutePlanNameFromIds(
  routeId: number,
  feeCategoryId: number,
  categoryHeadId: number | null | undefined,
  classId: number | null | undefined,
  routes: Array<{ id: number; name: string }>,
  feeCategories: Array<{ id: number; name: string }>,
  categoryHeads: Array<{ id: number; name: string }>,
  classes: Array<{ id: number; name: string }>
): string {
  const route = routes.find((r) => r.id === routeId);
  const feeCategory = feeCategories.find((cat) => cat.id === feeCategoryId);
  const categoryHead = categoryHeadId
    ? categoryHeads.find((ch) => ch.id === categoryHeadId)
    : null;
  const classItem = classId
    ? classes.find((cls) => cls.id === classId)
    : null;

  return generateRoutePlanName({
    routeName: route?.name,
    feeCategoryName: feeCategory?.name,
    categoryHeadName: categoryHead?.name,
    className: classItem?.name,
  });
}

