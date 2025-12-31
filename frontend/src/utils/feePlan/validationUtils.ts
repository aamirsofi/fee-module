/**
 * Validation Utilities for Fee Plan Forms
 */

export interface FormData {
  schoolId: string | number;
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
 * Validate fee category selection
 */
export function validateFeeCategory(
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
    return { isValid: false, error: "Please select a fee heading" };
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
export function validateSingleModeForm(
  formData: FormData
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  const feeCategoryValidation = validateFeeCategory(formData.feeCategoryId);
  if (!feeCategoryValidation.isValid) return feeCategoryValidation;

  const classValidation = validateClass(formData.classId);
  if (!classValidation.isValid) return classValidation;

  return { isValid: true };
}

/**
 * Validate form data for multiple mode
 */
export function validateMultipleModeForm(
  formData: FormData,
  selectedFeeCategoryIds: number[],
  selectedClasses: number[]
): ValidationResult {
  const schoolValidation = validateSchool(formData.schoolId);
  if (!schoolValidation.isValid) return schoolValidation;

  const amountValidation = validateAmount(formData.amount);
  if (!amountValidation.isValid) return amountValidation;

  if (selectedFeeCategoryIds.length === 0) {
    return {
      isValid: false,
      error: "Please select at least one fee heading",
    };
  }

  if (selectedClasses.length === 0) {
    return {
      isValid: false,
      error: "Please select at least one class",
    };
  }

  return { isValid: true };
}

/**
 * Validate editing form
 */
export function validateEditForm(formData: FormData): ValidationResult {
  const singleModeValidation = validateSingleModeForm(formData);
  if (!singleModeValidation.isValid) return singleModeValidation;

  // Additional validation for edit mode if needed
  return { isValid: true };
}

