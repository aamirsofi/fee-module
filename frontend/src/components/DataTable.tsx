import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, X, Download, FileText, Printer } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { exportToCSV, exportToExcel, printTable } from "@/utils/export"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface FilterOption {
  label: string
  value: string
  column: string
  icon?: React.ReactNode
}

interface FilterConfig {
  column: string
  title: string
  options: Omit<FilterOption, 'column'>[]
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  enableRowSelection?: boolean
  filterButtons?: React.ReactNode
  filterOptions?: FilterOption[]
  filterConfigs?: FilterConfig[]
  // Server-side pagination props
  manualPagination?: boolean
  pageCount?: number
  onPaginationChange?: (pageIndex: number, pageSize: number) => void
  onSearchChange?: (search: string) => void
  totalRows?: number
  // External pagination state (for syncing)
  externalPageIndex?: number
  externalPageSize?: number
  // External search value (for syncing)
  externalSearchValue?: string
  // Export props
  exportFileName?: string
  exportTitle?: string
  enableExport?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  enableRowSelection = true,
  filterButtons,
  filterOptions,
  filterConfigs,
  manualPagination = false,
  pageCount,
  onPaginationChange,
  onSearchChange,
  totalRows,
  externalPageIndex,
  externalPageSize,
  externalSearchValue,
  exportFileName = 'export',
  exportTitle = 'Table Data',
  enableExport = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({})
  const [filterSearch, setFilterSearch] = React.useState<Record<string, string>>({})
  const [openFilterDropdown, setOpenFilterDropdown] = React.useState<string | null>(null)
  const [searchValue, setSearchValue] = React.useState<string>(externalSearchValue || "")
  
  // Sync search value when external prop changes
  React.useEffect(() => {
    if (externalSearchValue !== undefined) {
      setSearchValue(externalSearchValue)
    }
  }, [externalSearchValue])
  
  // Debounce search value for server-side pagination
  const debouncedSearchValue = useDebounce(searchValue, 500)

  // Add checkbox column if row selection is enabled
  const columnsWithSelection = React.useMemo(() => {
    if (!enableRowSelection) return columns
    
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    
    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection])

  const [pagination, setPagination] = React.useState({
    pageIndex: externalPageIndex !== undefined ? externalPageIndex : 0,
    pageSize: externalPageSize !== undefined ? externalPageSize : 10,
  })

  // Sync pagination state when external props change
  React.useEffect(() => {
    if (externalPageIndex !== undefined || externalPageSize !== undefined) {
      setPagination({
        pageIndex: externalPageIndex !== undefined ? externalPageIndex : pagination.pageIndex,
        pageSize: externalPageSize !== undefined ? externalPageSize : pagination.pageSize,
      })
    }
  }, [externalPageIndex, externalPageSize])

  React.useEffect(() => {
    if (manualPagination && onPaginationChange) {
      onPaginationChange(pagination.pageIndex, pagination.pageSize)
    }
  }, [pagination.pageIndex, pagination.pageSize, manualPagination, onPaginationChange])

  // Trigger search change callback when debounced value changes (for server-side pagination)
  React.useEffect(() => {
    if (manualPagination && onSearchChange) {
      onSearchChange(debouncedSearchValue)
    }
  }, [debouncedSearchValue, manualPagination, onSearchChange])

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: manualPagination ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection,
    manualPagination: manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onPaginationChange: setPagination,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2 flex-1">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={manualPagination ? searchValue : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")}
              onChange={(event) => {
                const value = event.target.value
                if (manualPagination) {
                  // Update local state immediately for responsive UI
                  setSearchValue(value)
                  // Debounced value will trigger onSearchChange via useEffect
                } else {
                  table.getColumn(searchKey)?.setFilterValue(value)
                }
              }}
              className="max-w-sm"
            />
          )}
          {filterButtons && (
            <div className="flex items-center gap-2">
              {filterButtons}
            </div>
          )}
          {filterConfigs && filterConfigs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filterConfigs.map((config) => {
                const column = table.getColumn(config.column)
                const selectedValues = selectedFilters[config.column] || []
                
                // Calculate counts from original data, excluding current column filter
                // Apply all filters except the current column's filter
                const otherFilters = columnFilters.filter((f) => f.id !== config.column)
                let filteredData = data
                
                // Apply other column filters
                otherFilters.forEach((filter) => {
                  const filterColumn = table.getColumn(filter.id)
                  if (filterColumn && filter.value !== undefined) {
                    filteredData = filteredData.filter((row) => {
                      const rowValue = filterColumn.columnDef.accessorFn
                        ? filterColumn.columnDef.accessorFn(row as any, 0)
                        : (row as any)[filter.id]
                      if (typeof filter.value === 'string') {
                        return String(rowValue).toLowerCase().includes(filter.value.toLowerCase())
                      }
                      return rowValue === filter.value
                    })
                  }
                })
                
                // Calculate counts for each option
                const optionCounts = config.options.map((option) => {
                  const count = filteredData.filter((row: any) => {
                    const value = row[config.column]
                    return value === option.value
                  }).length
                  return { ...option, count }
                })

                // Filter options based on search
                const searchTerm = filterSearch[config.column] || ""
                const filteredOptions = optionCounts.filter((option) =>
                  option.label.toLowerCase().includes(searchTerm.toLowerCase())
                )

                return (
                  <React.Fragment key={config.column}>
                    {/* Filter Dropdown */}
                    <DropdownMenu
                      open={openFilterDropdown === config.column}
                      onOpenChange={(open) =>
                        setOpenFilterDropdown(open ? config.column : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Plus className="h-4 w-4" />
                          {config.title}
                          {selectedValues.length > 0 && (
                            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                              {selectedValues.length} selected
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[200px]">
                        <div className="p-2">
                          <Input
                            placeholder={config.title}
                            value={filterSearch[config.column] || ""}
                            onChange={(e) =>
                              setFilterSearch({
                                ...filterSearch,
                                [config.column]: e.target.value,
                              })
                            }
                            className="h-8"
                          />
                        </div>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredOptions.map((option) => {
                            const isSelected = selectedValues.includes(option.value)
                            return (
                              <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newSelected = checked
                                    ? [...selectedValues, option.value]
                                    : selectedValues.filter((v) => v !== option.value)
                                  
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    [config.column]: newSelected,
                                  })

                                  // Update table filter
                                  if (newSelected.length === 0) {
                                    column?.setFilterValue(undefined)
                                  } else if (newSelected.length === 1) {
                                    // Single value - use direct comparison
                                    column?.setFilterValue(newSelected[0])
                                  } else {
                                    // Multiple values - use array
                                    column?.setFilterValue(newSelected)
                                  }
                                }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {option.icon}
                                  <span>{option.label}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {option.count}
                                </span>
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                        </div>
                        {selectedValues.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8"
                                onClick={() => {
                                  setSelectedFilters({
                                    ...selectedFilters,
                                    [config.column]: [],
                                  })
                                  column?.setFilterValue(undefined)
                                  setOpenFilterDropdown(null)
                                }}
                              >
                                Clear filters
                              </Button>
                            </div>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Selected Filter Tags */}
                    {selectedValues.map((value) => {
                      const option = config.options.find((opt) => opt.value === value)
                      if (!option) return null
                      return (
                        <Button
                          key={`${config.column}-${value}`}
                          variant="secondary"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => {
                            const newSelected = selectedValues.filter((v) => v !== value)
                            setSelectedFilters({
                              ...selectedFilters,
                              [config.column]: newSelected,
                            })
                            if (newSelected.length === 0) {
                              column?.setFilterValue(undefined)
                            } else if (newSelected.length === 1) {
                              column?.setFilterValue(newSelected[0])
                            } else {
                              column?.setFilterValue(newSelected)
                            }
                          }}
                        >
                          {option.label}
                          <X className="h-3 w-3" />
                        </Button>
                      )
                    })}
                  </React.Fragment>
                )
              })}
              {/* Global Reset Button - Only show if any filters are active */}
              {filterConfigs && Object.values(selectedFilters).some((arr) => arr.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => {
                    filterConfigs.forEach((config) => {
                      table.getColumn(config.column)?.setFilterValue(undefined)
                    })
                    setSelectedFilters({})
                  }}
                >
                  Reset
                  <X className="h-3 w-3" />
                </Button>
              )}
              {/* Legacy filterOptions support */}
              {filterOptions && filterOptions.length > 0 && !filterConfigs && (
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const groupedFilters: Record<string, FilterOption[]> = {}
                    filterOptions.forEach((option) => {
                      if (!groupedFilters[option.column]) {
                        groupedFilters[option.column] = []
                      }
                      groupedFilters[option.column].push(option)
                    })

                    return Object.entries(groupedFilters).map(([columnKey, options]) => (
                      <div key={columnKey} className="flex items-center gap-2">
                        {options.map((option) => {
                          const column = table.getColumn(option.column)
                          const isSelected = selectedFilters[option.column]?.includes(option.value)
                          return (
                            <Button
                              key={`${option.column}-${option.value}`}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                const currentSelected = selectedFilters[option.column] || []
                                const newSelected = isSelected
                                  ? currentSelected.filter((v) => v !== option.value)
                                  : [...currentSelected, option.value]
                                
                                setSelectedFilters({
                                  ...selectedFilters,
                                  [option.column]: newSelected,
                                })

                            if (newSelected.length === 0) {
                              column?.setFilterValue(undefined)
                            } else if (newSelected.length === 1) {
                              column?.setFilterValue(newSelected[0])
                            } else {
                              column?.setFilterValue(newSelected)
                            }
                              }}
                            >
                              {option.label}
                            </Button>
                          )
                        })}
                      </div>
                    ))
                  })()}
                  {(Object.values(selectedFilters).some((arr) => arr.length > 0)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        filterOptions.forEach((option) => {
                          table.getColumn(option.column)?.setFilterValue(undefined)
                        })
                        setSelectedFilters({})
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {enableExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    const visibleColumns = table
                      .getAllColumns()
                      .filter((column) => column.getIsVisible() && column.id !== 'select' && column.id !== 'actions')
                    
                    const exportColumns = visibleColumns.map((column) => {
                      const columnDef = column.columnDef
                      let header = column.id
                      if (typeof columnDef.header === 'string') {
                        header = columnDef.header
                      } else if (typeof columnDef.header === 'function') {
                        try {
                          const headerResult = columnDef.header({ column, header: column, table })
                          if (typeof headerResult === 'string') {
                            header = headerResult
                          }
                        } catch (e) {
                          // Fallback to column id
                        }
                      }
                      return {
                        header: header || column.id,
                        accessorFn: (row: TData) => {
                          try {
                            const columnDef = column.columnDef as any
                            const rowData = row as any
                            
                            // Get the raw value using accessorKey if available
                            if (columnDef.accessorKey) {
                              const value = rowData[columnDef.accessorKey]
                              
                              // Handle nested objects (e.g., school.name)
                              if (value && typeof value === 'object' && !Array.isArray(value)) {
                                // If it's an object with a name property, use that (e.g., school.name)
                                if ('name' in value && typeof value.name === 'string') {
                                  return value.name
                                }
                                // If it's an object with an id property, use that as fallback
                                if ('id' in value) {
                                  return String(value.id)
                                }
                                // Otherwise return empty string for complex objects
                                return ''
                              }
                              
                              // Return the value directly if it's a primitive
                              if (value === null || value === undefined) {
                                return ''
                              }
                              return String(value)
                            }
                            
                            // For columns without accessorKey, try to get value by column id
                            if (column.id) {
                              const value = rowData[column.id]
                              if (value && typeof value === 'object' && !Array.isArray(value)) {
                                if ('name' in value && typeof value.name === 'string') {
                                  return value.name
                                }
                                return ''
                              }
                              return value !== null && value !== undefined ? String(value) : ''
                            }
                            
                            return ''
                          } catch (e) {
                            return ''
                          }
                        },
                      }
                    })
                    exportToCSV(data, exportColumns, `${exportFileName}.csv`)
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    const visibleColumns = table
                      .getAllColumns()
                      .filter((column) => column.getIsVisible() && column.id !== 'select' && column.id !== 'actions')
                    
                    const exportColumns = visibleColumns.map((column) => {
                      const columnDef = column.columnDef
                      let header = column.id
                      if (typeof columnDef.header === 'string') {
                        header = columnDef.header
                      } else if (typeof columnDef.header === 'function') {
                        try {
                          const headerResult = columnDef.header({ column, header: column, table })
                          if (typeof headerResult === 'string') {
                            header = headerResult
                          }
                        } catch (e) {
                          // Fallback to column id
                        }
                      }
                      return {
                        header: header || column.id,
                        accessorFn: (row: TData) => {
                          try {
                            const columnDef = column.columnDef as any
                            const rowData = row as any
                            
                            // Get the raw value using accessorKey if available
                            if (columnDef.accessorKey) {
                              const value = rowData[columnDef.accessorKey]
                              
                              // Handle nested objects (e.g., school.name)
                              if (value && typeof value === 'object' && !Array.isArray(value)) {
                                // If it's an object with a name property, use that (e.g., school.name)
                                if ('name' in value && typeof value.name === 'string') {
                                  return value.name
                                }
                                // If it's an object with an id property, use that as fallback
                                if ('id' in value) {
                                  return String(value.id)
                                }
                                // Otherwise return empty string for complex objects
                                return ''
                              }
                              
                              // Return the value directly if it's a primitive
                              if (value === null || value === undefined) {
                                return ''
                              }
                              return String(value)
                            }
                            
                            // For columns without accessorKey, try to get value by column id
                            if (column.id) {
                              const value = rowData[column.id]
                              if (value && typeof value === 'object' && !Array.isArray(value)) {
                                if ('name' in value && typeof value.name === 'string') {
                                  return value.name
                                }
                                return ''
                              }
                              return value !== null && value !== undefined ? String(value) : ''
                            }
                            
                            return ''
                          } catch (e) {
                            return ''
                          }
                        },
                      }
                    })
                    exportToExcel(data, exportColumns, `${exportFileName}.xlsx`)
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  onClick={() => {
                    const visibleColumns = table
                      .getAllColumns()
                      .filter((column) => column.getIsVisible() && column.id !== 'select' && column.id !== 'actions')
                    
                    const exportColumns = visibleColumns.map((column) => {
                      const columnDef = column.columnDef
                      let header = column.id
                      if (typeof columnDef.header === 'string') {
                        header = columnDef.header
                      } else if (typeof columnDef.header === 'function') {
                        try {
                          const headerResult = columnDef.header({ column, header: column, table })
                          if (typeof headerResult === 'string') {
                            header = headerResult
                          }
                        } catch (e) {
                          // Fallback to column id
                        }
                      }
                      return {
                        header: header || column.id,
                        accessorFn: (row: TData) => {
                          try {
                            const columnDef = column.columnDef as any
                            const rowData = row as any
                            
                            // Get the raw value using accessorKey if available
                            if (columnDef.accessorKey) {
                              const value = rowData[columnDef.accessorKey]
                              
                              // Handle nested objects (e.g., school.name)
                              if (value && typeof value === 'object' && !Array.isArray(value)) {
                                // If it's an object with a name property, use that (e.g., school.name)
                                if ('name' in value && typeof value.name === 'string') {
                                  return value.name
                                }
                                // If it's an object with an id property, use that as fallback
                                if ('id' in value) {
                                  return String(value.id)
                                }
                                // Otherwise return empty string for complex objects
                                return ''
                              }
                              
                              // Return the value directly if it's a primitive
                              if (value === null || value === undefined) {
                                return ''
                              }
                              return String(value)
                            }
                            
                            // For columns without accessorKey, try to get value by column id
                            if (column.id) {
                              const value = rowData[column.id]
                              if (value && typeof value === 'object' && !Array.isArray(value)) {
                                if ('name' in value && typeof value.name === 'string') {
                                  return value.name
                                }
                                return ''
                              }
                              return value !== null && value !== undefined ? String(value) : ''
                            }
                            
                            return ''
                          } catch (e) {
                            return ''
                          }
                        },
                      }
                    })
                    printTable(data, exportColumns, exportTitle)
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                View <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "select" ? "Select" : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0 ? (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {manualPagination && totalRows !== undefined
                ? totalRows
                : table.getFilteredRowModel().rows.length}{" "}
              row(s) selected.
            </>
          ) : (
            <>
              {manualPagination && totalRows !== undefined
                ? `Showing ${(pagination.pageIndex * pagination.pageSize) + 1} to ${Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)} of ${totalRows} row(s)`
                : `${table.getFilteredRowModel().rows.length} row(s) total.`}
            </>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                const newPageSize = Number(value)
                table.setPageSize(newPageSize)
                if (manualPagination && onPaginationChange) {
                  onPaginationChange(0, newPageSize) // Reset to first page when changing page size
                }
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {manualPagination && pageCount !== undefined ? pageCount : table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

