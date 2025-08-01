# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js React application for email processing and bank reconciliation. The app includes:

## Project Structure
- **Page 1 (Emails)**: Display emails with PDF receipt attachments and process them
- **Page 2 (Ledger)**: Show parsed transactions and allow CSV bank statement uploads for comparison
- **Database**: SQLite with Prisma for storing ledger entries
- **PDF Processing**: Extract transaction details from receipt PDFs
- **CSV Upload**: Process bank statements for transaction matching

## Key Features
- Email display with PDF attachment handling
- PDF receipt parsing and data extraction
- Ledger management with transaction storage
- CSV bank statement upload and processing
- Transaction matching and comparison between ledger and bank data
- Clear visualization of matched/unmatched transactions

## Technology Stack
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite database
- PDF parsing libraries
- File upload handling

When generating code, focus on:
- Type safety with TypeScript
- Responsive design with Tailwind CSS
- Proper error handling
- Database operations with Prisma
- File processing capabilities
- Clean component architecture
