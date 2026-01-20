import Papa from 'papaparse';
import { CSVRow } from '../types';

/**
 * Helper to clean currency strings from various bank formats
 * Handles: "R$ 1.200,50", "1.200,50", "-1.200,50", "(1.200,50)", "1,200.50"
 */
const cleanCurrency = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  let str = value.toString().trim();

  // Explicit check for Brazilian Real symbol to force BR parsing logic
  const hasBRLSymbol = str.includes('R$') || str.includes('BRL');

  // Handle parentheses for negative values (common in accounting) e.g., "(150.00)"
  const isNegativeParenthesis = str.startsWith('(') && str.endsWith(')');
  if (isNegativeParenthesis) {
    str = str.replace(/[()]/g, '');
  }

  // Remove currency symbols and whitespace (R$, $, BRL, etc)
  str = str.replace(/[A-Za-z$\s]/g, '');

  // Detect format: Brazilian/European (comma is decimal) vs US (dot is decimal)
  // Logic: If explicitly BRL symbol was found OR if comma is after dot (1.200,00) OR comma exists and no dot (1200,50)

  const lastCommaIndex = str.lastIndexOf(',');
  const lastDotIndex = str.lastIndexOf('.');

  // Force BR logic if R$ is present or if structure looks like 1.234,56
  if (hasBRLSymbol || lastCommaIndex > lastDotIndex) {
    // It's likely Brazilian format: 1.234,56
    // Remove dots (thousands separators)
    str = str.replace(/\./g, '');
    // Replace comma with dot (decimal separator)
    str = str.replace(',', '.');
  } else {
    // It's likely US format: 1,234.56
    // Remove commas (thousands separators)
    str = str.replace(/,/g, '');
  }

  const parsed = parseFloat(str);

  // Apply negative sign if it was in parentheses
  return isNegativeParenthesis ? parsed * -1 : parsed;
};

export const parseCSV = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // We look for common amount column names and clean them.
        // Increased limit to 1000 rows to cover full months/years of busy accounts
        const cleanedData = results.data.slice(0, 1000).map((row: any) => {
          const newRow: any = {};

          // Normalize Keys and Clean Values
          Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase().trim();
            const value = row[key];

            // 1. IDENTIFY DATE
            if (lowerKey === 'data' || lowerKey === 'date' || lowerKey.includes('dt_')) {
              newRow['date'] = value;
            }
            // 2. IDENTIFY AMOUNT
            else if (
              lowerKey === 'amount' ||
              lowerKey === 'valor' ||
              lowerKey === 'value' ||
              lowerKey.includes('quantia') ||
              lowerKey.includes('saldo')
            ) {
              newRow['amount'] = cleanCurrency(value);
            }
            // 3. IDENTIFY DESCRIPTION
            else if (
              lowerKey === 'description' ||
              lowerKey === 'descrição' ||
              lowerKey === 'descricao' ||
              lowerKey === 'histórico' ||
              lowerKey.includes('memo') ||
              lowerKey.includes('details')
            ) {
              newRow['description'] = value;
            }
            // 4. KEEP OTHERS (Optional, for context if needed by AI)
            else {
              newRow[key] = value;
            }
          });

          // Fallback: If description is missing, try to find a generic string column
          if (!newRow['description']) {
            const fallbackDesc = Object.keys(row).find(k => k.toLowerCase().includes('desc'));
            if (fallbackDesc) newRow['description'] = row[fallbackDesc];
          }

          return newRow;
        });

        // Filter out empty rows or rows without amount/date to avoid validation errors
        const validRows = cleanedData.filter((r: any) => r.amount !== undefined && (r.date || r.description));

        resolve(JSON.stringify(validRows));
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};