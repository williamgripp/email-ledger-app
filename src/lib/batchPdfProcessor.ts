import { extractPdfFromUrl } from './pdfExtractor';

/**
 * Process multiple PDF URLs in parallel
 * @param urls Array of PDF URLs to process
 * @returns Array of processing results
 */
export async function batchProcessPdfUrls(urls: string[]): Promise<Array<{ text: string, amount: number, success: boolean, error?: string }>> {
  console.log(`Processing ${urls.length} PDFs in parallel...`);
  
  // Process all URLs in parallel
  const promises = urls.map(async (url, index) => {
    try {
      console.log(`[${index + 1}/${urls.length}] Processing: ${url}`);
      const result = await extractPdfFromUrl(url);
      console.log(`[${index + 1}/${urls.length}] ${result.success ? '✅' : '❌'} Amount: $${result.amount}`);
      return result;
    } catch (error) {
      console.log(`[${index + 1}/${urls.length}] ❌ Error: ${error}`);
      return {
        text: '',
        amount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
  
  const results = await Promise.all(promises);
  
  console.log(`\nBatch processing complete: ${results.filter(r => r.success).length}/${results.length} successful`);
  
  return results;
}
