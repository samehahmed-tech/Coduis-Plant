/**
 * reportPrintStyles.ts — Professional @media print CSS for Reports
 * Clean black/white output with branded header
 */

export const getReportPrintCSS = (restaurantName: string, reportTitle: string, dateRange: string): string => `
<style>
  @media print {
    /* Hide non-printable elements */
    nav, .no-print, button, .sidebar, [class*="sidebar"],
    [class*="backdrop"], [class*="animate"], [class*="gradient"],
    [class*="chartjs-"], [class*="glow"] {
      display: none !important;
    }

    /* Reset page */
    @page {
      margin: 15mm 12mm;
      size: A4 portrait;
    }

    body, html {
      background: white !important;
      color: #111 !important;
      font-family: 'Segoe UI', Arial, sans-serif !important;
      font-size: 11pt !important;
      line-height: 1.4 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    * {
      box-shadow: none !important;
      text-shadow: none !important;
      border-radius: 0 !important;
      backdrop-filter: none !important;
    }

    /* Tables — clean professional look */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 8px 0 !important;
      page-break-inside: auto !important;
    }

    table thead tr {
      background: #222 !important;
      color: white !important;
      -webkit-print-color-adjust: exact !important;
    }

    table th {
      background: #222 !important;
      color: white !important;
      padding: 8px 10px !important;
      font-size: 9pt !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      text-align: left !important;
      border: 1px solid #333 !important;
    }

    table td {
      padding: 6px 10px !important;
      font-size: 10pt !important;
      border: 1px solid #ddd !important;
      color: #222 !important;
    }

    table tbody tr:nth-child(even) {
      background: #f8f8f8 !important;
    }

    /* Charts become smaller but visible */
    .recharts-wrapper, .recharts-surface {
      max-height: 240px !important;
    }

    /* Cards flatten */
    [class*="card"], [class*="Card"] {
      border: 1px solid #ddd !important;
      background: white !important;
      margin-bottom: 12px !important;
      padding: 12px !important;
    }

    /* headings */
    h1, h2, h3, h4 {
      color: #111 !important;
      page-break-after: avoid !important;
    }

    /* badges, pills */
    [class*="badge"], [class*="pill"], [class*="tag"] {
      border: 1px solid #999 !important;
      background: white !important;
      color: #333 !important;
    }

    /* page breaks */
    .page-break { page-break-before: always; }
    tr { page-break-inside: avoid; }

    /* KPI values */
    [class*="tabular-nums"] {
      font-variant-numeric: tabular-nums !important;
    }
  }

  /* Print header — only visible when printing */
  .print-header {
    display: none;
  }
  @media print {
    .print-header {
      display: block !important;
      text-align: center;
      padding: 0 0 16px 0;
      margin-bottom: 16px;
      border-bottom: 3px solid #111;
    }
    .print-header h1 {
      font-size: 18pt;
      font-weight: 900;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .print-header .print-subtitle {
      font-size: 12pt;
      font-weight: 700;
      color: #555;
      margin-top: 4px;
    }
    .print-header .print-date {
      font-size: 9pt;
      color: #888;
      margin-top: 4px;
    }
    .print-footer {
      display: block !important;
      text-align: center;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 8pt;
      color: #aaa;
      padding: 8px 0;
      border-top: 1px solid #eee;
    }
  }
</style>

<!-- Print Header (only shows when printing) -->
<div class="print-header">
  <h1>${restaurantName}</h1>
  <div class="print-subtitle">${reportTitle}</div>
  <div class="print-date">${dateRange} &mdash; Printed ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
</div>

<div class="print-footer" style="display:none;">
  ${restaurantName} &bull; Powered by RestoFlow ERP &bull; Page <span class="page-number"></span>
</div>
`;
