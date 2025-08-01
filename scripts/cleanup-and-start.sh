#!/bin/bash

echo "🧹 Cleaning up Supabase data before starting development server..."

# Check if the dev server is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "ℹ️ Development server is already running on port 3001"
    echo "🔄 Calling cleanup API..."
    
    # Call the cleanup API
    CLEANUP_RESULT=$(curl -s -X POST http://localhost:3001/api/cleanup)
    
    if echo "$CLEANUP_RESULT" | grep -q '"success":true'; then
        echo "✅ Cleanup completed successfully"
        echo "$CLEANUP_RESULT" | grep -o '"total_items_deleted":[0-9]*' | sed 's/"total_items_deleted":/Total items deleted: /'
    else
        echo "⚠️ Cleanup may have failed, check the logs"
    fi
else
    echo "ℹ️ Development server not running, cleanup will happen when setup-database is called"
fi

echo "🚀 Ready to start development!"
