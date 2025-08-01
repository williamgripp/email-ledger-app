#!/bin/bash

echo "🚀 Starting Minerva development server with fresh data..."

# Start Next.js in the background
npm run dev:original &
DEV_PID=$!

echo "⏳ Waiting for server to be ready..."

# Wait for the server to start (check if port 3000 is listening)
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "❌ Server failed to start within 30 seconds"
    kill $DEV_PID 2>/dev/null
    exit 1
  fi
done

echo "🧹 Cleaning up old data..."
CLEANUP_RESULT=$(curl -s -X POST http://localhost:3000/api/cleanup 2>/dev/null)

if echo "$CLEANUP_RESULT" | grep -q '"success":true'; then
  echo "✅ Cleanup completed"
else
  echo "ℹ️ Cleanup skipped (tables may not exist yet)"
fi

echo "📧 Setting up fresh emails and invoices..."
SETUP_RESULT=$(curl -s -X POST http://localhost:3000/api/setup-database 2>/dev/null)

if echo "$SETUP_RESULT" | grep -q '"success":true'; then
  echo "✅ Fresh data generated! (10 emails, 7 with PDFs)"
else
  echo "ℹ️ Setup will be available once database tables are created"
fi

echo "🎉 Development server ready at http://localhost:3000"
echo "📊 Fresh data loaded automatically!"

# Keep the script running and forward signals to the Next.js process
trap "kill $DEV_PID 2>/dev/null; exit" INT TERM
wait $DEV_PID
