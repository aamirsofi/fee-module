/**
 * Duplicate Detection Utilities for Route Plans
 */

import { RoutePlan } from "../../types";
import { RoutePlanCombination } from "./combinationUtils";

/**
 * Check if a combination already exists in route plans
 */
export function isRoutePlanDuplicate(
  combination: RoutePlanCombination,
  existingRoutePlans: RoutePlan[]
): boolean {
  return existingRoutePlans.some((plan) => {
    const routeMatch = plan.routeId === combination.routeId;
    const feeCategoryMatch = plan.feeCategoryId === combination.feeCategoryId;
    const categoryHeadMatch =
      (plan.categoryHeadId === null && combination.categoryHeadId === null) ||
      (plan.categoryHeadId === combination.categoryHeadId);
    const classMatch =
      (plan.classId === null && combination.classId === null) ||
      (plan.classId === combination.classId);

    return routeMatch && feeCategoryMatch && categoryHeadMatch && classMatch;
  });
}

/**
 * Filter out duplicate combinations
 */
export function filterRoutePlanDuplicates(
  combinations: RoutePlanCombination[],
  existingRoutePlans: RoutePlan[]
): RoutePlanCombination[] {
  return combinations.filter(
    (combo) => !isRoutePlanDuplicate(combo, existingRoutePlans)
  );
}

/**
 * Find duplicate route plan
 */
export function findRoutePlanDuplicate(
  combination: RoutePlanCombination,
  existingRoutePlans: RoutePlan[]
): RoutePlan | undefined {
  return existingRoutePlans.find((plan) => {
    const routeMatch = plan.routeId === combination.routeId;
    const feeCategoryMatch = plan.feeCategoryId === combination.feeCategoryId;
    const categoryHeadMatch =
      (plan.categoryHeadId === null && combination.categoryHeadId === null) ||
      (plan.categoryHeadId === combination.categoryHeadId);
    const classMatch =
      (plan.classId === null && combination.classId === null) ||
      (plan.classId === combination.classId);

    return routeMatch && feeCategoryMatch && categoryHeadMatch && classMatch;
  });
}

