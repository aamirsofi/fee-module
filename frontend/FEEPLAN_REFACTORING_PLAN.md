# FeePlan.tsx Refactoring Plan

## Current State

- **File Size**: 2487 lines
- **Complexity**: Very High
- **Maintainability**: Low

## Refactoring Options

### Option 1: Extract Custom Hooks (Recommended First Step)

**Benefits**: Reduces component size, improves reusability, better separation of concerns

#### 1.1 `useFeePlanData.ts`

Extract all TanStack Query logic:

- `useFeeStructures` - Fee structures query
- `useFeeCategories` - Fee categories query
- `useCategoryHeads` - Category heads query
- `useClasses` - Classes query
- `useSchools` - Schools infinite query

**Estimated reduction**: ~200 lines

#### 1.2 `useFeePlanForm.ts`

Extract form state and logic:

- Form state management
- Form validation
- Form submission (single & bulk)
- Form reset logic

**Estimated reduction**: ~300 lines

#### 1.3 `useFeePlanImport.ts`

Extract import functionality:

- CSV parsing
- Name resolution
- Bulk import logic
- Import result handling

**Estimated reduction**: ~250 lines

#### 1.4 `useFeePlanSelection.ts`

Extract selection logic:

- Bulk selection state
- Select all logic
- Export functionality

**Estimated reduction**: ~100 lines

### Option 2: Extract Sub-Components

**Benefits**: Better component organization, easier to test, clearer structure

#### 2.1 `FeePlanForm.tsx`

- Single mode form
- Multiple mode form
- Form fields (School, Fee Category, Category Head, Class, Amount, Status)
- Form validation messages

**Estimated reduction**: ~400 lines

#### 2.2 `FeePlanImport.tsx`

- Import mode UI
- File upload area
- CSV preview table
- Import results display
- Sample CSV download

**Estimated reduction**: ~300 lines

#### 2.3 `FeePlanTable.tsx`

- Table header
- Table rows
- Bulk actions bar
- Empty state
- Loading state

**Estimated reduction**: ~200 lines

#### 2.4 `FeePlanFilters.tsx`

- Search input
- School filter dropdown
- Filter controls

**Estimated reduction**: ~50 lines

#### 2.5 `FeePlanDialogs.tsx`

- Delete confirmation dialog
- Bulk delete confirmation dialog

**Estimated reduction**: ~50 lines

### Option 3: Extract Utility Functions

**Benefits**: Reusable logic, easier to test, cleaner code

#### 3.1 `feePlanUtils.ts`

- CSV parsing logic
- Name-to-ID resolution
- Duplicate checking
- Plan name generation
- Export CSV generation

**Estimated reduction**: ~200 lines

#### 3.2 `feePlanValidation.ts`

- Form validation functions
- CSV validation functions

**Estimated reduction**: ~50 lines

### Option 4: Split by Feature (Comprehensive)

**Benefits**: Complete separation, easier to maintain, better code organization

#### File Structure:

```
src/pages/super-admin/fee-plan/
├── FeePlan.tsx (Main component - ~200 lines)
├── components/
│   ├── FeePlanForm.tsx
│   ├── FeePlanImport.tsx
│   ├── FeePlanTable.tsx
│   ├── FeePlanFilters.tsx
│   └── FeePlanDialogs.tsx
├── hooks/
│   ├── useFeePlanData.ts
│   ├── useFeePlanForm.ts
│   ├── useFeePlanImport.ts
│   └── useFeePlanSelection.ts
├── utils/
│   ├── feePlanUtils.ts
│   └── feePlanValidation.ts
└── types.ts (if needed)
```

## Recommended Approach: Phased Refactoring

### Phase 1: Extract Custom Hooks (Quick Win)

1. Create `hooks/useFeePlanData.ts`
2. Create `hooks/useFeePlanForm.ts`
3. Create `hooks/useFeePlanImport.ts`
4. Create `hooks/useFeePlanSelection.ts`

**Result**: Component reduces to ~1800 lines

### Phase 2: Extract Sub-Components

1. Create `components/FeePlanForm.tsx`
2. Create `components/FeePlanImport.tsx`
3. Create `components/FeePlanTable.tsx`
4. Create `components/FeePlanFilters.tsx`
5. Create `components/FeePlanDialogs.tsx`

**Result**: Component reduces to ~500 lines

### Phase 3: Extract Utilities

1. Create `utils/feePlanUtils.ts`
2. Create `utils/feePlanValidation.ts`

**Result**: Component reduces to ~300 lines

### Phase 4: Reorganize Structure (Optional)

Move everything to `fee-plan/` folder structure

**Result**: Better organization, easier to navigate

## Benefits Summary

### Before Refactoring:

- 2487 lines in one file
- Hard to navigate
- Difficult to test
- High cognitive load
- Hard to maintain

### After Refactoring:

- Main component: ~300 lines
- 4 custom hooks: ~800 lines total
- 5 sub-components: ~1000 lines total
- 2 utility files: ~250 lines total
- **Total**: Same functionality, better organized

## Implementation Priority

1. **High Priority**: Extract hooks (Phase 1) - Immediate benefit
2. **Medium Priority**: Extract components (Phase 2) - Better organization
3. **Low Priority**: Extract utilities & reorganize (Phase 3-4) - Polish

## Estimated Time

- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 1-2 hours
- Phase 4: 1 hour

**Total**: ~7-10 hours for complete refactoring
