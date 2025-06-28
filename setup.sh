#!/bin/bash

echo "🧠 MedGPT Scholar Setup Script"
echo "=============================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo "Please install Ollama from https://ollama.ai"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

echo "✅ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Starting Ollama..."
    echo "Please run 'ollama serve' in another terminal first."
    echo ""
    exit 1
fi

echo "✅ Ollama is running"

# Check for available models
echo "🔍 Checking available models..."
models=$(ollama list | grep -E "(llama3|phi3|mistral)" | wc -l)

if [ "$models" -eq 0 ]; then
    echo "📥 No recommended models found. Downloading llama3.1..."
    echo "This may take a while depending on your internet connection."
    ollama pull llama3.1
    echo "✅ llama3.1 downloaded successfully"
else
    echo "✅ Found $models recommended model(s)"
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env.local
    echo "✅ Environment file created"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start MedGPT Scholar:"
echo "1. Make sure Ollama is running: ollama serve"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For production builds:"
echo "• Build: npm run build"
echo "• Start: npm start"
echo ""
echo "⚠️  Medical Disclaimer: This tool is for educational purposes only."
echo "   Always consult healthcare professionals for medical advice."
