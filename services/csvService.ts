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
          const newRow: any = { ...row };
          
          // Find the column that likely contains the amount
          const amountKey = Object.keys(row).find(key => 
            key.toLowerCase().includes('amount') || 
            key.toLowerCase().includes('valor') || 
            key.toLowerCase().includes('quantia') ||
            key.toLowerCase().includes('saldo') ||
            key.toLowerCase().includes('value')
          );

          if (amountKey && newRow[amountKey]) {
            // Overwrite the string amount with the cleaned number
            // This ensures Gemini receives "1500.50" instead of "1.500,50" which confuses it.
            newRow[amountKey] = cleanCurrency(newRow[amountKey]);
          }

          return newRow;
        });

        resolve(JSON.stringify(cleanedData));
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};