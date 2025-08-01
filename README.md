# Email & Ledger Manager

A modern React application built with Next.js for processing emails with PDF receipts and managing bank statement reconciliation. This app reads incoming emails, extracts receipt data from PDF attachments, stores transactions in a ledger, and provides bank statement comparison functionality.

## Features

### 📧 Email Processing
- **Page 1: Emails** - View and manage emails with PDF receipt attachments
- Automatic receipt processing from email attachments
- Mark emails as processed/unprocessed
- Clean, responsive email interface

### 📊 Ledger Management
- **Page 2: Ledger** - Transaction management and bank reconciliation
- Automatically parsed receipt data stored in database
- Transaction categorization and editing
- Real-time ledger updates

### 🏦 Bank Statement Reconciliation
- CSV bank statement upload functionality
- Smart transaction matching algorithm
- Clear comparison view showing:
  - ✅ **Matched transactions** (ledger + bank)
  - ⚠️ **Ledger-only transactions** (receipts not in bank)
  - ℹ️ **Bank-only transactions** (bank entries not in ledger)

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Database**: SQLite with Prisma ORM
- **File Processing**: CSV parsing with Papa Parse
- **PDF Processing**: Built-in PDF parsing capabilities (ready for pdf-parse integration)
- **Icons**: Lucide React
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd minerva
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Email Processing
1. Navigate to the **Emails** page (home)
2. View emails with PDF attachments
3. Click "Process Receipt" to extract transaction data
4. Processed receipts automatically appear in the ledger

### Bank Reconciliation
1. Navigate to the **Ledger** page
2. Review your transaction ledger
3. Upload a CSV bank statement (format: `date`, `transaction` columns)
4. Review the comparison results:
   - Green: Matched transactions
   - Orange: Ledger-only (receipts missing from bank)
   - Blue: Bank-only (bank transactions missing from ledger)

### CSV Format
Your bank statement CSV should have these columns:
- `date` - Transaction date (YYYY-MM-DD format)
- `transaction` - Transaction description
- `amount` - Transaction amount (optional)

Example:
```csv
date,transaction,amount
2024-01-15,Amazon Purchase,89.99
2024-01-14,Starbucks Coffee,12.45
```

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes for data processing
│   ├── ledger/        # Ledger page
│   └── page.tsx       # Email page (home)
├── components/        # React components
│   ├── EmailList.tsx
│   ├── LedgerTable.tsx
│   ├── BankStatementUpload.tsx
│   └── Navigation.tsx
├── lib/
│   └── prisma.ts      # Database client
└── prisma/
    └── schema.prisma  # Database schema
```

## API Endpoints

- `GET /api/emails` - Fetch all emails
- `POST /api/emails` - Create new email
- `GET /api/ledger` - Fetch ledger entries
- `POST /api/ledger` - Create ledger entry
- `DELETE /api/ledger/[id]` - Delete ledger entry
- `POST /api/process-pdf` - Process PDF receipt

## Database Schema

### Emails
- ID, subject, sender, received date
- Attachment status and processing status

### Ledger Entries
- Date, amount, description, category
- Source tracking (email/manual)
- PDF path for receipt storage

## Development

### Adding PDF Processing
To integrate real PDF processing:

1. Install pdf-parse:
```bash
npm install pdf-parse @types/pdf-parse
```

2. Update `/api/process-pdf/route.ts` to use actual PDF parsing
3. Implement text extraction and receipt data parsing logic

### Database Updates
```bash
# After schema changes
npx prisma generate
npx prisma db push
```

### Production Build
```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect to Vercel
3. Deploy automatically with optimized settings

### Environment Variables
For production, ensure these are set:
- `DATABASE_URL` - Your production database URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue in the GitHub repository.
