# FeePlan.tsx Component Flow Documentation

## Overview

The `FeePlan.tsx` component is a refactored, modular component for managing fee plans. It uses custom hooks for data fetching, import functionality, and selection operations, with extracted UI components for better maintainability.

**Component Size:** 980 lines (down from 2329 lines - 58% reduction)

---

## 1. Initialization & State Setup (Lines 30-65)

```
Component Mounts
  ↓
Initialize Local State:
  - mode: "add" | "import" (default: "add")
  - error/success messages
  - pagination (page, limit)
  - search/filter state
  - form data (schoolId, feeCategoryId, categoryHeadId, amount, classId, status)
  - bulk selection state (selectedFeeCategoryIds, selectedCategoryHeadIds, selectedClasses)
  - editing state (editingStructure, formResetKey)
```

### State Variables

| State Variable            | Type                     | Purpose                                 |
| ------------------------- | ------------------------ | --------------------------------------- |
| `mode`                    | `"add" \| "import"`      | Controls which tab is active            |
| `error`                   | `string`                 | Error message display                   |
| `success`                 | `string`                 | Success message display                 |
| `page`                    | `number`                 | Current page for pagination             |
| `limit`                   | `number`                 | Items per page                          |
| `search`                  | `string`                 | Search query                            |
| `selectedSchoolId`        | `string \| number`       | Filter by school                        |
| `formData`                | `object`                 | Form input values                       |
| `createMode`              | `"single" \| "multiple"` | Single or bulk creation                 |
| `selectedFeeCategoryIds`  | `number[]`               | Selected categories for bulk mode       |
| `selectedCategoryHeadIds` | `number[]`               | Selected category heads for bulk mode   |
| `selectedClasses`         | `number[]`               | Selected classes for bulk mode          |
| `editingStructure`        | `FeeStructure \| null`   | Currently editing fee plan              |
| `formResetKey`            | `number`                 | Key to force Select component re-render |

---

## 2. Custom Hooks Initialization (Lines 67-127)

### 2.1 useFeePlanData Hook (Lines 68-88)

```
useFeePlanData Hook
  ↓
  Fetches & manages:
    - feeStructures (paginated list)
    - feeCategories (for form dropdowns)
    - schools (for form & filters)
    - categoryHeads (for form dropdowns)
    - classOptions (for form dropdowns)
    - All loading states
    - refetchFeeStructures function
```

**Parameters:**

- `page` - Current page number
- `limit` - Items per page
- `search` - Search query
- `selectedSchoolId` - Filter by school
- `formSchoolId` - School ID for form-dependent queries

**Returns:**

- `feeStructures` - List of fee plans
- `paginationMeta` - Pagination metadata
- `loadingFeeStructures` - Loading state
- `refetchFeeStructures` - Function to refetch data
- `feeCategories` - Available fee categories
- `loadingCategories` - Categories loading state
- `schools` - List of schools
- `loadingSchools` - Schools loading state
- `categoryHeads` - Available category heads
- `loadingCategoryHeads` - Category heads loading state
- `classOptions` - Available classes
- `availableClasses` - Class names array
- `loadingClasses` - Classes loading state

### 2.2 useFeePlanImport Hook (Lines 90-109)

```
useFeePlanImport Hook
  ↓
  Manages CSV import:
    - importSchoolId, importFile, importPreview
    - isImporting, importResult
    - getRootProps, getInputProps (dropzone)
    - downloadSampleCSV, handleBulkImport
```

**Parameters:**

- `refetchFeeStructures` - Function to refresh data after import
- `setError` - Error state setter
- `setSuccess` - Success state setter

**Returns:**

- `importSchoolId` - Selected school for import
- `setImportSchoolId` - Setter for import school
- `importFile` - Uploaded CSV file
- `setImportFile` - Setter for import file
- `importPreview` - Parsed CSV preview data
- `setImportPreview` - Setter for preview
- `isImporting` - Import in progress flag
- `importResult` - Import results (success/skipped/failed)
- `getRootProps` - Dropzone root props
- `getInputProps` - Dropzone input props
- `isDragActive` - Drag and drop active state
- `downloadSampleCSV` - Download sample CSV function
- `handleBulkImport` - Process and import CSV function

### 2.3 useFeePlanSelection Hook (Lines 111-127)

```
useFeePlanSelection Hook
  ↓
  Manages bulk operations:
    - selectedFeePlanIds, isSelectAll
    - handleSelectAll, handleSelectFeePlan
    - handleExport (CSV export)
    - handleBulkDelete
```

**Parameters:**

- `feeStructures` - List of fee plans
- `classOptions` - Available classes
- `refetchFeeStructures` - Function to refresh data
- `setError` - Error state setter
- `setSuccess` - Success state setter

**Returns:**

- `selectedFeePlanIds` - Array of selected fee plan IDs
- `setSelectedFeePlanIds` - Setter for selected IDs
- `isSelectAll` - All items selected flag
- `setIsSelectAll` - Setter for select all
- `handleSelectAll` - Toggle select all function
- `handleSelectFeePlan` - Toggle single selection function
- `handleExport` - Export selected to CSV function
- `handleBulkDelete` - Delete selected fee plans function

---

## 3. Side Effects (Lines 129-133)

```
useEffect: Clear classId when schoolId changes
```

**Purpose:** Ensures class selection is cleared when school changes, preventing invalid state.

---

## 4. Form Submission Logic (Lines 135-463)

### 4.1 handleSubmit Function Flow

```
handleSubmit (called from FeePlanForm)
  ↓
  Validate inputs
    ↓
  Check mode:
    ├─ Editing Mode → Update single fee plan
    └─ Create Mode:
        ├─ Single Mode → Create one fee plan
        └─ Multiple Mode → Create multiple combinations
            ↓
            Generate all combinations (feeCategory × categoryHead × class)
            ↓
            Check for duplicates
            ↓
            Create only new ones (skip duplicates)
            ↓
            Show success/error messages
```

### 4.2 Validation Steps

1. **School Validation**

   - Check if school is selected
   - Convert to number if string

2. **Amount Validation**

   - Check if amount is provided
   - Validate amount > 0

3. **Mode-Specific Validation**
   - **Multiple Mode:**
     - At least one fee category selected
     - At least one class selected
   - **Single Mode:**
     - Fee category selected
     - Class selected

### 4.3 Edit Mode Flow

```
Editing Mode
  ↓
  Find selected category, category head, class
  ↓
  Generate plan name
  ↓
  Build payload
  ↓
  PATCH request to API
  ↓
  Reset form
  ↓
  Show success message
  ↓
  Refetch data
```

### 4.4 Single Create Mode Flow

```
Single Create Mode
  ↓
  Find selected category, category head, class
  ↓
  Generate plan name
  ↓
  Build payload
  ↓
  POST request to API
  ↓
  Reset form
  ↓
  Show success message
  ↓
  Refetch data
```

### 4.5 Multiple Create Mode Flow

```
Multiple Create Mode
  ↓
  Generate all combinations:
    feeCategories × categoryHeads × classes
  ↓
  Fetch existing fee structures
  ↓
  Filter out duplicates
  ↓
  For each new combination:
    ├─ Generate plan name
    ├─ Build payload
    ├─ POST request to API
    └─ Handle errors (skip duplicates)
  ↓
  Show success message with counts:
    - Successfully created
    - Skipped (duplicates)
    - Failed
  ↓
  Reset bulk selections
  ↓
  Refetch data
```

---

## 5. Helper Functions (Lines 465-549)

### 5.1 resetForm()

**Purpose:** Reset form to initial state

**Parameters:**

- `retainSchool` (optional) - Keep current school selection
- `schoolId` (optional) - School ID to retain

**Actions:**

- Clear form data
- Reset create mode to "single"
- Clear bulk selections
- Clear error messages
- Increment formResetKey (force Select re-render)

### 5.2 handleEdit()

**Purpose:** Populate form with existing fee plan data

**Parameters:**

- `structure` - FeeStructure object to edit

**Actions:**

- Set editingStructure
- Populate formData with structure values
- Clear error/success messages

### 5.3 handleDeleteClick()

**Purpose:** Open delete confirmation dialog

**Parameters:**

- `id` - Fee plan ID
- `schoolId` - School ID

**Actions:**

- Set deleteItem state
- Open deleteDialogOpen

### 5.4 handleDelete()

**Purpose:** Delete single fee plan

**Flow:**

```
handleDelete
  ↓
  Validate deleteItem exists
  ↓
  DELETE request to API
  ↓
  Show success message
  ↓
  Close dialog
  ↓
  Refetch data
```

### 5.5 handleCancel()

**Purpose:** Cancel editing mode

**Actions:**

- Clear editingStructure
- Reset form
- Clear error/success messages

### 5.6 handleBulkDeleteClick()

**Purpose:** Open bulk delete confirmation dialog

**Flow:**

```
handleBulkDeleteClick
  ↓
  Validate selections exist
  ↓
  Open bulkDeleteDialogOpen
```

### 5.7 handleBulkDeleteWithDialog()

**Purpose:** Execute bulk delete and close dialog

**Flow:**

```
handleBulkDeleteWithDialog
  ↓
  Call handleBulkDelete (from hook)
  ↓
  Close dialog
```

---

## 6. UI Rendering (Lines 553-978)

### 6.1 Component Structure

```
<FeePlan>
  ├─ Header Card (Title & Description)
  ├─ Success/Error Messages
  └─ Main Grid (2 columns)
      ├─ Left Column (1/3 width)
      │   └─ Card with Tabs
      │       ├─ Tab: "Add Fee Plan"
      │       │   └─ <FeePlanForm>
      │       │       ├─ School Select
      │       │       ├─ Fee Heading Select (single/bulk mode)
      │       │       ├─ Amount Input
      │       │       ├─ Category Head Select
      │       │       ├─ Class Select
      │       │       ├─ Status Select
      │       │       └─ Submit Button
      │       │
      │       └─ Tab: "Import Fee Plans"
      │           └─ Import UI (inline)
      │               ├─ School Select
      │               ├─ Download Sample CSV
      │               ├─ File Upload (drag & drop)
      │               ├─ Preview Table
      │               ├─ Import Button
      │               └─ Import Results
      │
      └─ Right Column (2/3 width)
          └─ Card
              ├─ <FeePlanFilters>
              │   ├─ Search Input
              │   └─ School Filter Dropdown
              │
              └─ <FeePlanTable>
                  ├─ Bulk Actions Bar (if items selected)
                  ├─ Table with checkboxes
                  ├─ Edit/Delete buttons per row
                  └─ Pagination

      └─ <FeePlanDialogs>
          ├─ Single Delete Dialog
          └─ Bulk Delete Dialog
```

### 6.2 Left Column - Form/Import Section

#### Add Fee Plan Tab

**Component:** `<FeePlanForm>`

**Props Passed:**

- Form state (formData, setFormData)
- Create mode (createMode, setCreateMode)
- Bulk selections (selectedFeeCategoryIds, selectedCategoryHeadIds, selectedClasses)
- Editing state (editingStructure, formResetKey)
- Handlers (handleSubmit, handleCancel)
- Data (schools, feeCategories, categoryHeads, classOptions)
- Loading states

**Features:**

- School selection dropdown
- Fee heading selection (single dropdown or multi-select)
- Amount input
- Category head selection (single dropdown or multi-select)
- Class selection (single dropdown or multi-select)
- Status selection
- Preview for bulk mode (shows how many plans will be created)
- Submit button (text changes based on mode)

#### Import Fee Plans Tab

**Features:**

- School selection dropdown
- Download sample CSV button
- CSV format instructions
- File upload area (drag & drop)
- File preview (shows filename)
- Remove file button
- Preview table (shows parsed CSV data)
- Import button (disabled while importing)
- Import results display:
  - Success count
  - Skipped count (with duplicate details)
  - Failed count (with error details)

### 6.3 Right Column - List Section

#### FeePlanFilters Component

**Props:**

- `search` - Search query
- `setSearch` - Search setter
- `selectedSchoolId` - Selected school filter
- `setSelectedSchoolId` - School filter setter
- `schools` - List of schools
- `setPage` - Page setter (resets to page 1 on filter change)

**Features:**

- Search input with clear button
- School filter dropdown ("All Schools" option)

#### FeePlanTable Component

**Props:**

- `feeStructures` - List of fee plans
- `loading` - Loading state
- `paginationMeta` - Pagination metadata
- `page`, `limit` - Pagination state
- `setPage`, `setLimit` - Pagination setters
- `search`, `selectedSchoolId` - Filter values
- `selectedFeePlanIds` - Selected IDs
- `setSelectedFeePlanIds`, `setIsSelectAll` - Selection setters
- `isSelectAll` - Select all flag
- `handleSelectAll`, `handleSelectFeePlan` - Selection handlers
- `handleEdit` - Edit handler
- `handleDeleteClick` - Delete handler
- `handleExport` - Export handler
- `handleBulkDeleteClick` - Bulk delete handler

**Features:**

- Bulk actions bar (when items selected):
  - Selected count display
  - Export button
  - Delete button
  - Clear button
- Loading state display
- Empty state display
- Table with columns:
  - Checkbox (select all header)
  - Plan Name (with description)
  - School
  - Category Head
  - Amount (formatted currency)
  - Status (badge)
  - Actions (Edit, Delete buttons)
- Pagination component

### 6.4 Dialogs Section

#### FeePlanDialogs Component

**Props:**

- `deleteDialogOpen` - Single delete dialog state
- `setDeleteDialogOpen` - Single delete dialog setter
- `setDeleteItem` - Delete item setter
- `handleDelete` - Delete handler
- `bulkDeleteDialogOpen` - Bulk delete dialog state
- `setBulkDeleteDialogOpen` - Bulk delete dialog setter
- `selectedFeePlanIds` - Selected IDs
- `handleBulkDeleteWithDialog` - Bulk delete handler

**Dialogs:**

1. **Single Delete Dialog**

   - Confirmation message
   - Cancel button
   - Delete button

2. **Bulk Delete Dialog**
   - Confirmation message with count
   - Cancel button
   - Delete button with count

---

## 7. Data Flow Diagram

### 7.1 User Action → Component State → Hook → API → Update State → Re-render

#### Example 1: User Selects School in Form

```
User selects school
  ↓
formData.schoolId changes
  ↓
useFeePlanData detects formSchoolId change
  ↓
Refetches feeCategories, categoryHeads, classes for that school
  ↓
FeePlanForm re-renders with new options
```

#### Example 2: User Submits Form

```
User clicks Submit
  ↓
handleSubmit() validates inputs
  ↓
API call (POST/PATCH)
  ↓
Success response
  ↓
refetchFeeStructures() called
  ↓
Success message shown
  ↓
Form resets
  ↓
Table updates with new data
```

#### Example 3: User Selects Fee Plans

```
User checks fee plan checkbox
  ↓
handleSelectFeePlan() updates selectedFeePlanIds
  ↓
useFeePlanSelection hook updates state
  ↓
Bulk actions bar appears
  ↓
User clicks Export/Delete
  ↓
Hook handles operation
  ↓
Table updates
```

#### Example 4: User Uploads CSV

```
User selects school
  ↓
User uploads CSV file
  ↓
useFeePlanImport hook parses file
  ↓
importPreview populated
  ↓
User reviews preview
  ↓
User clicks Import
  ↓
handleBulkImport() processes rows
  ↓
Results shown (success/skipped/failed)
  ↓
refetchFeeStructures() called
  ↓
Table updates with new data
```

---

## 8. Component Responsibilities

| Component/Hook          | Responsibility                                               |
| ----------------------- | ------------------------------------------------------------ |
| **FeePlan.tsx**         | Orchestration, form submission logic, local state management |
| **useFeePlanData**      | Data fetching (TanStack Query), caching, refetching          |
| **useFeePlanImport**    | CSV import logic, file parsing, validation, bulk import      |
| **useFeePlanSelection** | Bulk selection management, export, bulk delete               |
| **FeePlanForm**         | Form UI rendering, input handling                            |
| **FeePlanTable**        | Table UI rendering, row actions                              |
| **FeePlanFilters**      | Search & filter UI                                           |
| **FeePlanDialogs**      | Delete confirmation dialogs                                  |

---

## 9. Key Features

### 9.1 Two Modes

- **Add Mode:** Form-based creation (single or bulk)
- **Import Mode:** CSV-based bulk import

### 9.2 Creation Modes

- **Single Mode:** Create one fee plan at a time
- **Multiple Mode:** Create multiple combinations at once

### 9.3 Bulk Operations

- Select multiple fee plans
- Export selected to CSV
- Delete selected fee plans

### 9.4 CSV Import

- Download sample CSV template
- Drag & drop file upload
- Preview before import
- Validation and error handling
- Detailed import results

### 9.5 Data Management

- Pagination
- Search functionality
- School filtering
- Real-time data updates via TanStack Query
- Optimistic updates

### 9.6 User Experience

- Loading states
- Error handling
- Success messages
- Form validation
- Duplicate detection
- Edit existing fee plans

---

## 10. File Structure

```
frontend/src/pages/super-admin/
├── FeePlan.tsx (Main component - 980 lines)
└── components/
    ├── FeePlanForm.tsx (~550 lines)
    ├── FeePlanTable.tsx (~265 lines)
    ├── FeePlanFilters.tsx (~83 lines)
    └── FeePlanDialogs.tsx (~90 lines)

frontend/src/hooks/pages/super-admin/
├── useFeePlanData.ts (~248 lines)
├── useFeePlanImport.ts (~593 lines)
└── useFeePlanSelection.ts (~195 lines)
```

---

## 11. Dependencies

### External Libraries

- `react` - React framework
- `@tanstack/react-query` - Data fetching and caching
- `react-dropzone` - File upload (via useFeePlanImport)
- `react-icons/fi` - Icons
- `shadcn/ui` - UI components (Button, Card, Select, Dialog, Input)

### Internal Dependencies

- `../../services/api` - API client
- `../../services/feePlanService` - Fee plan service
- `../../services/schoolService` - School service
- `../../types` - TypeScript types
- `../../components/Pagination` - Pagination component

---

## 12. Performance Considerations

1. **TanStack Query Caching:** Data is cached and automatically refetched when stale
2. **Pagination:** Large datasets are paginated to improve performance
3. **Lazy Loading:** Dropdowns load data only when school is selected
4. **Memoization:** Hooks use `useCallback` and `useMemo` where appropriate
5. **Optimistic Updates:** UI updates immediately, then syncs with server

---

## 13. Error Handling

1. **Form Validation:** Client-side validation before API calls
2. **API Error Handling:** Try-catch blocks with user-friendly error messages
3. **Duplicate Detection:** Checks for duplicates before creating
4. **Import Error Handling:** Per-row error tracking and reporting
5. **Network Error Handling:** Graceful degradation with error messages

---

## 14. Future Improvements

1. **Extract FeePlanImport Component:** Move import UI to separate component
2. **Extract Utility Functions:** Move CSV parsing and validation to utilities
3. **Fix useFeePlanForm Hook:** Resolve circular dependency for form logic extraction
4. **Add Unit Tests:** Test hooks and components individually
5. **Add E2E Tests:** Test complete user flows

---

## 15. Notes

- The component uses controlled components for all inputs
- Form state is managed locally (not in a hook) due to circular dependency concerns
- Import functionality uses the `useFeePlanImport` hook but UI is still inline
- All API calls go through the centralized `api` service
- Success/error messages auto-clear after 5 seconds
- Form resets after successful submission
- Bulk operations show detailed results

---

**Last Updated:** After refactoring (Component reduced from 2329 to 980 lines - 58% reduction)
