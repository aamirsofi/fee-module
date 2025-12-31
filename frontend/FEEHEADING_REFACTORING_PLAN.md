# FeeHeading.tsx Refactoring Plan

## Current State
- **File Size:** 1568 lines
- **Structure:** Monolithic component with all logic inline

## Refactoring Strategy

Following the same pattern as `FeePlan.tsx` and `CategoryHeads.tsx` refactoring:

### Phase 1: Extract Custom Hooks
1. **useFeeHeadingData** - Data fetching with TanStack Query
   - Fee categories list (paginated)
   - Schools list (for form and filters)
   - Loading states
   - Refetch function

2. **useFeeHeadingImport** - CSV import functionality
   - File upload (drag & drop)
   - CSV parsing
   - Bulk import with duplicate detection
   - Sample CSV download
   - Import results

3. **useFeeHeadingSelection** - Bulk selection operations
   - Selected category IDs
   - Select all functionality
   - Export to CSV
   - Bulk delete

### Phase 2: Extract Components
1. **FeeHeadingForm** - Form UI component
   - School selection
   - Category name input
   - Type dropdown
   - Description textarea
   - Status dropdown
   - Applicable months selector
   - Submit/Cancel buttons
   - Import UI (tabs)

2. **FeeHeadingFilters** - Search and filter UI
   - Search input
   - School filter dropdown
   - Type filter dropdown

3. **FeeHeadingTable** - Table UI component
   - Bulk actions bar
   - Table rendering with checkboxes
   - Edit/Delete action buttons
   - Pagination

4. **FeeHeadingDialogs** - Delete confirmation dialogs
   - Single delete confirmation
   - Bulk delete confirmation (if needed)

### Phase 3: Extract Utilities (if needed)
- CSV parsing utilities (can reuse from feePlan utils)
- Validation utilities (if complex)

## Expected Outcome
- **Main Component:** ~300-400 lines (orchestration only)
- **Hooks:** ~200-300 lines each
- **Components:** ~150-250 lines each
- **Total Reduction:** ~60-70% reduction in main component

## Benefits
- Better separation of concerns
- Reusable components
- Easier testing
- Better maintainability
- Consistent with FeePlan.tsx and CategoryHeads.tsx patterns

