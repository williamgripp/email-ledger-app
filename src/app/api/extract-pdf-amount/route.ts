import { NextRequest, NextResponse } from 'next/server';
import { extractPdfFromUrl } from '@/lib/pdfExtractor';

export async function POST(request: NextRequest) {
  try {
    // Get PDF URL from request
    const { pdfUrl } = await request.json();
    
    if (!pdfUrl) {
      return NextResponse.json({
        success: false,
        error: 'No PDF URL provided'
      }, { status: 400 });
    }

    console.log(`🔍 Extracting amount from PDF URL: ${pdfUrl}`);
    
    const result = await extractPdfFromUrl(pdfUrl);
    
    if (result.success) {
      console.log(`✅ Successfully extracted amount: $${result.amount.toFixed(2)}`);
      return NextResponse.json({
        success: true,
        amount: result.amount,
        text: result.text.substring(0, 200) + '...' // Return truncated text to avoid large response
      });
    } else {
      console.warn(`⚠️ No amount found in PDF`);
      return NextResponse.json({
        success: false,
        amount: 0,
        error: 'No amount found in PDF'
      });
    }
  } catch (error) {
    console.error('Error extracting PDF amount:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support GET requests with URL as a query parameter
export async function GET(request: NextRequest) {
  try {
    // Get PDF URL from query parameter
    const url = new URL(request.url);
    const pdfUrl = url.searchParams.get('pdfUrl');
    
    if (!pdfUrl) {
      return NextResponse.json({
        success: false,
        error: 'No PDF URL provided in query parameter'
      }, { status: 400 });
    }

    console.log(`🔍 Extracting amount from PDF URL: ${pdfUrl}`);
    
    const result = await extractPdfFromUrl(pdfUrl);
    
    if (result.success) {
      console.log(`✅ Successfully extracted amount: $${result.amount.toFixed(2)}`);
      return NextResponse.json({
        success: true,
        amount: result.amount,
        text: result.text.substring(0, 200) + '...' // Return truncated text to avoid large response
      });
    } else {
      console.warn(`⚠️ No amount found in PDF`);
      return NextResponse.json({
        success: false,
        amount: 0,
        error: 'No amount found in PDF'
      });
    }
  } catch (error) {
    console.error('Error extracting PDF amount:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
