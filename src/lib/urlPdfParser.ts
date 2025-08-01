import { PDFInvoiceParser } from '@/lib/pdfParser';
import { PDFJSParser } from '@/lib/pdfjsParser';

export interface ParsedPDFResult {
  success: boolean;
  data?: {
    amount: number;
    invoiceNumber: string;
    date: string;
    vendor: string;
    description: string;
    total?: number; // For backward compatibility
  };
  error?: string;
}

export class URLPDFParser {
  /**
   * Parse a PDF directly from a URL
   * This is designed to be Vercel-compatible with no Python dependencies
   */
  static async parseFromURL(pdfUrl: string): Promise<ParsedPDFResult> {
    try {
      console.log(`🔍 Parsing PDF from URL: ${pdfUrl}`);
      
      // Download the PDF from the URL
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to download PDF: HTTP ${response.status} ${response.statusText}`
        };
      }
      
      // Convert to buffer
      const pdfArrayBuffer = await response.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      
      // Use our existing PDF parser
      const parsedData = await PDFInvoiceParser.parseInvoice(pdfBuffer);
      
      if (!parsedData) {
        return {
          success: false,
          error: 'Failed to extract data from PDF'
        };
      }
      
      // Return result in format compatible with API response
      return {
        success: true,
        data: {
          ...parsedData,
          total: parsedData.amount // Include total for backward compatibility
        }
      };
    } catch (error) {
      console.error('PDF URL parsing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Enhanced version to attempt multiple parsing strategies
   * when the standard method fails
   */
  static async enhancedParseFromURL(pdfUrl: string): Promise<ParsedPDFResult> {
    console.log(`🔍 Enhanced PDF parsing for URL: ${pdfUrl}`);
    
    // Try with PDF.js parser first (more reliable)
    try {
      const pdfJsResult = await PDFJSParser.parsePdfUrl(pdfUrl);
      
      if (pdfJsResult && pdfJsResult.amount > 0) {
        console.log(`✅ PDF.js parser extracted amount: $${pdfJsResult.amount}`);
        return {
          success: true,
          data: {
            ...pdfJsResult,
            total: pdfJsResult.amount // Include total for backward compatibility
          }
        };
      }
      
      console.log('⚠️ PDF.js parser failed to extract a valid amount, trying standard parser');
    } catch (pdfJsError) {
      console.error('PDF.js parsing error:', pdfJsError);
      console.log('⚠️ PDF.js parser failed, falling back to standard parser');
    }
    
    // Try standard parsing as fallback
    const standardResult = await this.parseFromURL(pdfUrl);
    
    // If successful and amount is non-zero, return it
    if (standardResult.success && standardResult.data?.amount && standardResult.data.amount > 0) {
      console.log(`✅ Standard parser extracted amount: $${standardResult.data.amount}`);
      return standardResult;
    }
    
    // Otherwise, try last-resort strategies
    try {
      // Download the PDF
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        return standardResult; // Return our previous result if we can't download again
      }
      
      const pdfArrayBuffer = await response.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      
      // Last resort: aggressive text extraction from PDF
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        
        // Aggressive amount extraction
        const dollarAmounts = this.extractAllDollarAmounts(text);
        
        if (dollarAmounts.length > 0) {
          // Assume the largest amount is likely the total
          const maxAmount = Math.max(...dollarAmounts);
          console.log(`✅ Last-resort extraction found amount: $${maxAmount}`);
          
          // Create a new result with this amount
          return {
            success: true,
            data: {
              amount: maxAmount,
              invoiceNumber: standardResult.data?.invoiceNumber || `INV-${Date.now()}`,
              date: standardResult.data?.date || new Date().toISOString().split('T')[0],
              vendor: standardResult.data?.vendor || 'Unknown Vendor',
              description: standardResult.data?.description || `Invoice for $${maxAmount}`,
              total: maxAmount
            }
          };
        }
      } catch (pdfParseError) {
        console.error('Last-resort PDF parsing failed:', pdfParseError);
      }
      
      // If we still can't find an amount, return the original result
      return standardResult;
      
    } catch (error) {
      console.error('Enhanced PDF parsing failed:', error);
      return standardResult; // Return the original result on error
    }
  }
  
  /**
   * Extract all dollar amounts from text using aggressive pattern matching
   */
  private static extractAllDollarAmounts(text: string): number[] {
    const amounts: number[] = [];
    
    // Various patterns to find dollar amounts
    const patterns = [
      /\$\s*(\d+(?:,\d{3})*\.?\d*)/g,  // $123,456.78
      /(\d+(?:,\d{3})*\.?\d*)\s*(?:dollars|USD)/gi,  // 123,456.78 dollars
      /(?:total|amount|due|balance|payment)(?:\s*(?:due|is|of|:))?\s*\$?\s*(\d+(?:,\d{3})*\.?\d*)/gi,  // Total: $123.45
      /(?:invoice|charge|fee)\s+(?:total|amount|sum)(?:\s*(?:due|is|of|:))?\s*\$?\s*(\d+(?:,\d{3})*\.?\d*)/gi,  // Invoice total: $123.45
      /(\d+(?:,\d{3})*\.?\d*)/g  // Just look for any number as last resort
    ];
    
    // Try each pattern
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          // Remove commas and convert to float
          const cleanValue = match[1].replace(/,/g, '');
          const amount = parseFloat(cleanValue);
          
          // Only include valid-looking amounts (between $1 and $10,000)
          if (!isNaN(amount) && amount > 0 && amount < 10000) {
            amounts.push(amount);
          }
        } catch {
          // Skip invalid matches
          continue;
        }
      }
      
      // If we found some amounts with this pattern, don't try more aggressive patterns
      if (amounts.length > 0 && pattern.toString().includes('total|amount|due')) {
        break;
      }
    }
    
    return amounts;
  }
}
