# CategoryHeads.tsx Refactoring Plan

## Current State
- **File Size:** 653 lines
- **Structure:** Monolithic component with all logic inline

## Refactoring Strategy

Following the same pattern as `FeePlan.tsx` refactoring:

### Phase 1: Extract Custom Hooks
1. **useCategoryHeadsData** - Data fetching with TanStack Query
   - Category heads list (paginated)
   - Schools list (for form and filters)
   - Loading states
   - Refetch function

### Phase 2: Extract Components
1. **CategoryHeadsForm** - Form UI component
   - School selection
   - Name input
   - Description textarea
   - Status dropdown
   - Submit/Cancel buttons

2. **CategoryHeadsFilters** - Search and filter UI
   - Search input
   - School filter dropdown

3. **CategoryHeadsTable** - Table UI component
   - Table rendering
   - Edit/Delete actions
   - Pagination

4. **CategoryHeadsDialogs** - Delete confirmation dialog
   - Single delete confirmation

### Phase 3: Extract Utilities (if needed)
- Validation utilities (simple, can be inline or extracted)

## Expected Outcome
- **Main Component:** ~200-250 lines (orchestration only)
- **Hooks:** ~150-200 lines
- **Components:** ~100-150 lines each
- **Total Reduction:** ~40-50% reduction in main component

## Benefits
- Better separation of concerns
- Reusable components
- Easier testing
- Better maintainability
- Consistent with FeePlan.tsx pattern

