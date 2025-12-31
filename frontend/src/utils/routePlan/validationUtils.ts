/**
 * Validation Utilities for Route Plan Forms
 */

export interface RoutePlanFormData {
  schoolId: string | number;
  routeId: string | number;
  feeCategoryId: string | number;
  categoryHeadId: string | number | null;
  amount: string;
  classId: string | number;
  status: "active" | "inactive";
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate school selection
 */
export function validateSchool(
  schoolId: string | number
): ValidationResult {
  const schoolIdNum =
    typeof schoolId === "string" ? parseInt(schoolId, 10) : schoolId;
  if (!schoolIdNum || schoolIdNum === 0 || isNaN(schoolIdNum)) {
    return { isValid: false, error: "Please select a school" };
  }
  return { isValid: true };
}

/**
 * Validate amount
 */
export function validateAmount(amount: string): ValidationResult {
  if (!amount || parseFloat(amount) <= 0) {
    return { isValid: false, error: "Please enter a valid amount" };
  }
  return { isValid: true };
}

/**
 * Validate route selection
 */
export function validateRoute(
  routeId: string | number
): ValidationResult {
  const routeIdNum =
    typeof routeId === "string"
      ? parseInt(routeId, 10)
      : routeId;
  if (
    !routeIdNum ||
    routeIdNum === 0 ||
    isNaN(routeIdNum)
  ) {
    return { isValid: false, error: "Please select a route" };
  }
  return { isValid: true };
}

/**
 * Validate transport fee category selection
 */
export function validateTransportFeeCategory(
  feeCategoryId: string | number
): ValidationResult {
  const feeCategoryIdNum =
    typeof feeCategoryId === "string"
      ? parseInt(feeCategoryId, 10)
      : feeCategoryId;
  if (
    !feeCategoryIdNum ||
    feeCategoryIdNum === 0 ||
    isNaN(feeCategoryIdNum)
  ) {
    return { isValid: false, error: "Please select a transport fee heading" };
  }
  return { isValid: true };
}

/**
 * Validate class selection
 */
export function validateClass(classId: string | number): ValidationResult {
  if (!classId) {
    return { isValid: false, error: "Please select a class" };
  }
  return { isValid: true };
}

/**
 * Validate form data for single mode
 */
export function validateSingleModeRoutePlanForm(
  formData: RoutePlanFormData
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const routeValidation = validateRoute(formData.routeId);
  if (!routeValidation.isValid) return routeValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  const feeCategoryValidation = validateTransportFeeCategory(formData.feeCategoryId);
  if (!feeCategoryValidation.isValid) return feeCategoryValidation;

  const classValidation = validateClass(formData.classId);
  if (!classValidation.isValid) return classValidation;

  return { isValid: true };
}

/**
 * Validate form data for multiple mode
 */
export function validateMultipleModeRoutePlanForm(
  formData: RoutePlanFormData,
  selectedRouteIds: number[],
  selectedFeeCategoryIds: number[],
  selectedClasses: number[]
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  if (selectedRouteIds.length === 0) {
    return { isValid: false, error: "Please select at least one route" };
  }

  if (selectedFeeCategoryIds.length === 0) {
    return { isValid: false, error: "Please select at least one transport fee heading" };
  }

  if (selectedClasses.length === 0) {
    return { isValid: false, error: "Please select at least one class" };
  }

  return { isValid: true };
}

/**
 * Validate form data for edit mode
 */
export function validateEditRoutePlanForm(
  formData: RoutePlanFormData
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const routeValidation = validateRoute(formData.routeId);
  if (!routeValidation.isValid) return routeValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  const feeCategoryValidation = validateTransportFeeCategory(formData.feeCategoryId);
  if (!feeCategoryValidation.isValid) return feeCategoryValidation;

  const classValidation = validateClass(formData.classId);
  if (!classValidation.isValid) return classValidation;

  return { isValid: true };
}

