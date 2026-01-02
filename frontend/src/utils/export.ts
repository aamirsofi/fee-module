/**
 * Export table data to CSV format
 */
export function exportToCSV<T>(
  data: T[],
  columns: { header: string; accessorKey?: string; accessorFn?: (row: T) => any }[],
  filename: string = 'export.csv'
): void {
  // Get headers
  const headers = columns.map(col => col.header).join(',')
  
  // Get rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value: any
      if (col.accessorFn) {
        value = col.accessorFn(row)
      } else if (col.accessorKey) {
        value = (row as any)[col.accessorKey]
      } else {
        value = ''
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = ''
      }
      
      // Convert to string and escape commas/quotes
      const stringValue = String(value).replace(/"/g, '""')
      return `"${stringValue}"`
    }).join(',')
  })
  
  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n')
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export table data to Excel format (CSV with .xlsx extension for better compatibility)
 */
export function exportToExcel<T>(
  data: T[],
  columns: { header: string; accessorKey?: string; accessorFn?: (row: T) => any }[],
  filename: string = 'export.xlsx'
): void {
  // Excel can read CSV files, so we'll use CSV format with .xlsx extension
  exportToCSV(data, columns, filename.replace('.xlsx', '.csv'))
}

/**
 * Print table data
 */
export function printTable<T>(
  data: T[],
  columns: { header: string; accessorKey?: string; accessorFn?: (row: T) => any }[],
  title: string = 'Table Data'
): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print')
    return
  }

  // Get headers
  const headers = columns.map(col => col.header)
  
  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Get rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value: any
      if (col.accessorFn) {
        value = col.accessorFn(row)
      } else if (col.accessorKey) {
        value = (row as any)[col.accessorKey]
        // Handle nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          if ('name' in value && typeof value.name === 'string') {
            value = value.name
          } else if ('id' in value) {
            value = String(value.id)
          } else {
            value = ''
          }
        }
      } else {
        value = ''
      }
      
      // Convert to string and escape HTML
      const stringValue = value === null || value === undefined ? '' : String(value)
      return escapeHtml(stringValue)
    })
  })
  
  // Create HTML table
  const tableHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            margin-bottom: 20px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('\n            ')}
          </tbody>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Printed on: ${new Date().toLocaleString()}
        </p>
      </body>
    </html>
  `
  
  printWindow.document.write(tableHTML)
  printWindow.document.close()
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      // Close window after printing (optional)
      // printWindow.close()
    }, 250)
  }
}

