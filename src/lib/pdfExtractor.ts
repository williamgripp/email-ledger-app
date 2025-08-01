// @ts-expect-error - types for pdf-parse are not correctly set up
import pdf from 'pdf-parse/lib/pdf-parse.js';
import fetch from 'node-fetch';

/**
 * Extract text and amount from a PDF URL
 * @param url URL of the PDF to extract text from
 * @returns Object containing the text and largest amount found
 */
export async function extractPdfFromUrl(url: string): Promise<{ text: string, amount: number, success: boolean, error?: string }> {
  try {
    if (!url) {
      return {
        text: '',
        amount: 0,
        success: false,
        error: 'No PDF URL provided'
      };
    }
    
    console.log(`Extracting PDF from ${url}...`);
    const response = await fetch(url);

    if (!response.ok) {
      return {
        text: '',
        amount: 0,
        success: false,
        error: `Failed to fetch PDF: ${response.status} ${response.statusText}`
      };
    }

    // Get buffer from response
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Call the pdf-parse library with the PDF buffer
    const data = await pdf(buffer);
    const text = data.text;
    
    // Extract amount with an improved regex that catches more dollar amount formats
    const amountPattern = /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
    let match;
    const amounts: number[] = [];
    
    while ((match = amountPattern.exec(text)) !== null) {
      const value = match[1].replace(/,/g, '');
      const amount = parseFloat(value);
      if (!isNaN(amount) && amount > 0) {
        amounts.push(amount);
      }
    }
    
    // Find the largest amount or default to 0
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    
    return {
      text,
      amount: maxAmount,
      success: maxAmount > 0
    };
  } catch (error) {
    return {
      text: '',
      amount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function for just getting the amount
export async function extractAmountFromPdfUrl(url: string): Promise<number> {
  const result = await extractPdfFromUrl(url);
  return result.amount;
}

// Export the extractPdfFromUrl as the default export
export default extractPdfFromUrl;
