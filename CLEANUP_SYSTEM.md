# Database Cleanup System

## Overview
The application now includes automatic cleanup functionality to prevent duplicate data accumulation during development.

## How It Works

### 🧹 Automatic Cleanup Process

When you call `/api/setup-database`, it now automatically:

1. **Clears Database Tables** (preserves structure):
   - Deletes all rows from `ledger` table (foreign key constraint handled)
   - Deletes all rows from `emails` table  
   - Deletes all rows from `uploaded` table

2. **Clears Storage Bucket**:
   - Lists all files in the `invoices` bucket
   - Deletes all PDF files to prevent storage bloat
   - Logs the number of files deleted

3. **Regenerates Fresh Data**:
   - Creates 10 new emails with realistic content
   - Generates 7 PDF invoices with unique filenames
   - Uploads PDFs to Supabase storage
   - Creates matching ledger entries

### 🆕 Available API Endpoints

#### `POST /api/setup-database`
- **Purpose**: Full setup with automatic cleanup
- **Process**: Clean → Generate → Upload
- **Response**: Summary of created emails and ledger entries

#### `POST /api/cleanup` 
- **Purpose**: Cleanup only (no regeneration)
- **Process**: Clean database + storage
- **Response**: Count of deleted items

### 📋 NPM Scripts Added

```bash
# Start development with cleanup (if server running)
npm run dev:clean

# Manual cleanup (requires server to be running)
npm run cleanup

# Normal development start
npm run dev
```

### 🔄 Development Workflow

#### Option 1: Fresh Start Every Time
```bash
npm run dev:clean
```

#### Option 2: Manual Control
```bash
# Start server
npm run dev

# Clean when needed
curl -X POST http://localhost:3001/api/cleanup

# Reset data when needed  
curl -X POST http://localhost:3001/api/setup-database
```

### 📊 Cleanup Logging

The system provides detailed logging:

```
🧹 Cleaning up existing data...
✅ Cleared ledger entries
✅ Cleared emails  
✅ Cleared uploaded file records
✅ Deleted 7 files from invoices bucket
```

### 🛡️ Safety Features

- **Table Structure Preserved**: Only data is deleted, not table schemas
- **Foreign Key Handling**: Deletes in correct order (ledger first, then emails)
- **Error Handling**: Continues cleanup even if some operations fail
- **Detailed Logging**: Shows exactly what was cleaned

### 🎯 Benefits

1. **No Duplicate Data**: Fresh data on every setup
2. **Storage Efficiency**: Prevents PDF file accumulation  
3. **Consistent Testing**: Known starting state for development
4. **Easy Reset**: Quick way to start over with clean data

### ⚡ Quick Commands

```bash
# Setup fresh data (recommended)
curl -X POST http://localhost:3001/api/setup-database

# Just cleanup (keep empty)
curl -X POST http://localhost:3001/api/cleanup

# Check cleanup worked
curl -s http://localhost:3001/api/cleanup | grep "total_items_deleted"
```

This system ensures you always have fresh, realistic test data without manual intervention!
