import { InvoiceData } from './pdfGenerator';

export interface GeneratedEmail {
  id: string;
  subject: string;
  sender: string;
  receivedAt: Date;
  hasAttachment: boolean;
  body: string;
  invoiceData?: InvoiceData;
  pdfFileName?: string;
}

export function generateRandomEmail(): GeneratedEmail {
  const emailTemplates = [
    {
      senders: ['auto-confirm@amazon.com', 'orders@amazon.com', 'shipment-tracking@amazon.com'],
      subjectTemplates: [
        'Your Amazon.com order has been shipped',
        'Receipt for Amazon Order #{orderNumber}',
        'Your Amazon purchase confirmation',
        'Amazon.com order confirmation - Order #{orderNumber}'
      ],
      bodyTemplates: [
        'Thank you for your recent purchase. Your order has been processed and will be shipped soon.',
        'This email confirms that your order has been received and is being prepared for shipment.',
        'Your Amazon order is complete. Please find your receipt attached.'
      ]
    },
    {
      senders: ['receipt@starbucks.com', 'store@starbucks.com', 'rewards@starbucks.com'],
      subjectTemplates: [
        'Your Starbucks Receipt',
        'Thanks for visiting Starbucks!',
        'Starbucks Receipt - Store #{storeNumber}',
        'Your Starbucks Stars are waiting!'
      ],
      bodyTemplates: [
        'Thank you for choosing Starbucks! Your receipt is attached.',
        'We appreciate your visit today. Enjoy your beverages!',
        'Thanks for being a loyal customer. Your receipt details are attached.'
      ]
    },
    {
      senders: ['receipts@wholefoods.com', 'customercare@wholefoods.com', 'store@wholefoods.com'],
      subjectTemplates: [
        'Whole Foods Market Receipt',
        'Thank you for shopping with us - Receipt #{receiptNumber}',
        'Your Whole Foods purchase receipt',
        'Grocery receipt from Whole Foods Market'
      ],
      bodyTemplates: [
        'Thank you for shopping at Whole Foods Market. Your receipt is attached.',
        'We appreciate your business! Find your detailed receipt attached.',
        'Your grocery receipt from today\'s visit is ready for download.'
      ]
    },
    {
      senders: ['orders@officedepot.com', 'customerservice@officedepot.com', 'store@officedepot.com'],
      subjectTemplates: [
        'Office Depot Order Confirmation',
        'Your Office Depot receipt - Order #{orderNumber}',
        'Office supplies order complete',
        'Thank you for your Office Depot purchase'
      ],
      bodyTemplates: [
        'Your office supplies order has been completed. Receipt attached.',
        'Thank you for choosing Office Depot for your business needs.',
        'Your order confirmation and receipt are ready for review.'
      ]
    },
    {
      senders: ['receipts@shell.com', 'station@shell.com', 'fuel@shell.com'],
      subjectTemplates: [
        'Shell Gas Station Receipt',
        'Fuel purchase receipt - Station #{stationNumber}',
        'Thank you for choosing Shell',
        'Your Shell fuel receipt'
      ],
      bodyTemplates: [
        'Thank you for fueling up at Shell. Your receipt is attached.',
        'Your fuel purchase receipt from Shell station is ready.',
        'Thanks for choosing Shell for your fuel needs.'
      ]
    },
    {
      senders: ['noreply@restaurant.com', 'orders@ubereats.com', 'receipts@doordash.com'],
      subjectTemplates: [
        'Your food delivery receipt',
        'Order confirmation - #{orderNumber}',
        'Thanks for your order!',
        'Delivery completed - Receipt attached'
      ],
      bodyTemplates: [
        'Your food order has been delivered. Enjoy your meal!',
        'Thank you for ordering with us. Receipt details attached.',
        'Your delivery is complete. Find your receipt attached.'
      ]
    }
  ];

  // Non-receipt email templates (30% of emails)
  const nonReceiptTemplates = [
    {
      senders: ['newsletter@company.com', 'marketing@store.com', 'promotions@retail.com'],
      subjectTemplates: [
        'Weekly Newsletter - Special Offers Inside',
        'Don\'t miss out on our latest deals!',
        'Exclusive member offers this week',
        'New arrivals you might like'
      ],
      bodyTemplates: [
        'Check out our latest products and special offers this week.',
        'Exclusive deals for our valued customers. Limited time only!',
        'New arrivals and trending items just for you.'
      ]
    },
    {
      senders: ['support@service.com', 'help@company.com', 'notifications@app.com'],
      subjectTemplates: [
        'Account Security Update',
        'Important: Please verify your email',
        'Your account settings have been updated',
        'Weekly activity summary'
      ],
      bodyTemplates: [
        'This is a security notification regarding your account.',
        'Please take a moment to verify your email address.',
        'Your account has been updated successfully.'
      ]
    }
  ];

  const shouldHaveAttachment = Math.random() < 0.7; // 70% chance of having attachment
  const templates = shouldHaveAttachment ? emailTemplates : nonReceiptTemplates;
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const sender = template.senders[Math.floor(Math.random() * template.senders.length)];
  const subjectTemplate = template.subjectTemplates[Math.floor(Math.random() * template.subjectTemplates.length)];
  const bodyTemplate = template.bodyTemplates[Math.floor(Math.random() * template.bodyTemplates.length)];

  // Replace placeholders
  const orderNumber = Math.floor(Math.random() * 9999999) + 1000000;
  const receiptNumber = Math.floor(Math.random() * 999999) + 100000;
  const storeNumber = Math.floor(Math.random() * 999) + 100;

  const subject = subjectTemplate
    .replace('{orderNumber}', orderNumber.toString())
    .replace('{receiptNumber}', receiptNumber.toString())
    .replace('{storeNumber}', storeNumber.toString());

  // Generate random received date within last 30 days
  const receivedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

  return {
    id: `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    subject,
    sender,
    receivedAt,
    hasAttachment: shouldHaveAttachment,
    body: bodyTemplate,
    invoiceData: undefined // Will be populated when PDF is generated
  };
}
