import jsPDF from 'jspdf';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  vendor: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  customer: {
    name: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export function generatePDFInvoice(invoiceData: InvoiceData): Uint8Array {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE', 20, 25);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 35);
  doc.text(`Date: ${invoiceData.date}`, 20, 42);
  
  // Vendor info
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('From:', 20, 55);
  doc.setFontSize(10);
  doc.text(invoiceData.vendor.name, 20, 62);
  doc.text(invoiceData.vendor.address, 20, 68);
  doc.text(invoiceData.vendor.phone, 20, 74);
  doc.text(invoiceData.vendor.email, 20, 80);
  
  // Customer info
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('To:', 120, 55);
  doc.setFontSize(10);
  doc.text(invoiceData.customer.name, 120, 62);
  doc.text(invoiceData.customer.address, 120, 68);
  
  // Items table header
  let yPos = 100;
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Description', 20, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 140, yPos);
  doc.text('Total', 170, yPos);
  
  // Draw line under header
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  
  // Items
  doc.setFontSize(9);
  invoiceData.items.forEach((item) => {
    doc.text(item.description, 20, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(`$${item.unitPrice.toFixed(2)}`, 140, yPos);
    doc.text(`$${item.total.toFixed(2)}`, 170, yPos);
    yPos += 7;
  });
  
  // Totals
  yPos += 10;
  doc.line(120, yPos, 190, yPos);
  yPos += 7;
  
  doc.text('Subtotal:', 140, yPos);
  doc.text(`$${invoiceData.subtotal.toFixed(2)}`, 170, yPos);
  yPos += 7;
  
  doc.text('Tax:', 140, yPos);
  doc.text(`$${invoiceData.tax.toFixed(2)}`, 170, yPos);
  yPos += 7;
  
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('Total:', 140, yPos);
  doc.text(`$${invoiceData.total.toFixed(2)}`, 170, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 20, 250);
  doc.text('Payment due within 30 days.', 20, 255);
  
  return doc.output('arraybuffer') as Uint8Array;
}

export function generateRandomInvoiceData(): InvoiceData {
  const vendors = [
    {
      name: 'Amazon.com, Inc.',
      address: '410 Terry Ave N, Seattle, WA 98109',
      phone: '(206) 266-1000',
      email: 'orders@amazon.com'
    },
    {
      name: 'Starbucks Corporation',
      address: '2401 Utah Ave S, Seattle, WA 98134',
      phone: '(800) 782-7282',
      email: 'info@starbucks.com'
    },
    {
      name: 'Whole Foods Market',
      address: '550 Bowie St, Austin, TX 78703',
      phone: '(512) 477-4455',
      email: 'customercare@wholefoods.com'
    },
    {
      name: 'Office Depot, Inc.',
      address: '6600 N Military Trl, Boca Raton, FL 33496',
      phone: '(561) 438-4800',
      email: 'orders@officedepot.com'
    },
    {
      name: 'Shell Gas Station',
      address: '150 N Dairy Ashford Rd, Houston, TX 77079',
      phone: '(713) 241-6161',
      email: 'receipts@shell.com'
    }
  ];

  const itemTemplates = [
    { description: 'Office Supplies Bundle', minPrice: 15, maxPrice: 89 },
    { description: 'Coffee & Pastry', minPrice: 8, maxPrice: 25 },
    { description: 'Organic Groceries', minPrice: 45, maxPrice: 180 },
    { description: 'Printer Paper (500 sheets)', minPrice: 12, maxPrice: 35 },
    { description: 'Premium Gasoline', minPrice: 35, maxPrice: 75 },
    { description: 'Wireless Mouse', minPrice: 20, maxPrice: 60 },
    { description: 'Notebook Set', minPrice: 10, maxPrice: 30 },
    { description: 'Lunch Combo', minPrice: 12, maxPrice: 28 }
  ];

  const vendor = vendors[Math.floor(Math.random() * vendors.length)];
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

  // Generate 1-4 items
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = [];
  
  for (let i = 0; i < numItems; i++) {
    const template = itemTemplates[Math.floor(Math.random() * itemTemplates.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = Math.random() * (template.maxPrice - template.minPrice) + template.minPrice;
    const total = quantity * unitPrice;
    
    items.push({
      description: template.description,
      quantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
      total: Math.round(total * 100) / 100
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.0875; // 8.75% tax
  const total = subtotal + tax;

  return {
    invoiceNumber,
    date,
    vendor,
    customer: {
      name: 'John Doe',
      address: '123 Main St, Anytown, CA 90210'
    },
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}
