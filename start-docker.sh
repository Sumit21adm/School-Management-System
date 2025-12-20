#!/bin/bash

echo "🚀 Starting School Management System (Virtual Environment)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "📦 Building and starting containers..."
docker-compose up -d --build

echo "
🎉 Environment Started Successfully!

- 💻 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3001
- 🗄️  Database: MySQL (Port 3306 exposed)

Logs are being streamed below (Press Ctrl+C to exit logs, containers will keep running):
"

docker-compose logs -f
