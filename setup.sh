#!/bin/bash
# PrepAI — Quick Setup Script for Mac

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║    PrepAI Interview Platform Setup     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Java
if ! command -v java &> /dev/null; then
  echo "❌ Java not found. Install Java 17+: brew install openjdk@17"
  exit 1
fi
echo "✅ Java: $(java -version 2>&1 | head -1)"

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found."
  echo "   Run: brew install node"
  exit 1
fi
echo "✅ Node.js: $(node --version)"

# Check Maven
if ! command -v mvn &> /dev/null; then
  echo "❌ Maven not found."
  echo "   Run: brew install maven"
  exit 1
fi
echo "✅ Maven: $(mvn --version | head -1)"

# Check MySQL
if ! command -v mysql &> /dev/null; then
  echo "⚠️  MySQL CLI not found in PATH. Make sure MySQL is running."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 NEXT STEPS:"
echo ""
echo "1. Edit backend/src/main/resources/application.properties:"
echo "   - Set your MySQL password"
echo "   - Set your Anthropic API key (get at console.anthropic.com)"
echo ""
echo "2. Start the backend:"
echo "   cd backend && mvn spring-boot:run"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend && npm install && npm start"
echo ""
echo "4. Open http://localhost:3000 in your browser 🚀"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install frontend deps if node_modules absent
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install --silent && cd ..
  echo "✅ Frontend dependencies installed"
fi

echo "✅ Setup complete. Follow the steps above to start the app!"
