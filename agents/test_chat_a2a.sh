#!/bin/bash

echo "🧪 Testing Chat Agent with Remote A2A Agents"
echo "=============================================="
echo ""

# Activate virtual environment
VENV_PATH="../.venv"
if [ -d "$VENV_PATH" ]; then
    echo "Activating virtual environment: $VENV_PATH"
    source "$VENV_PATH/bin/activate"
    echo "Using Python: $(which python)"
    echo ""
else
    echo "⚠️  Virtual environment not found at $VENV_PATH"
    echo "   Run: uv sync"
    exit 1
fi

# Check if a2a-sdk is installed
if python -c "import a2a" 2>/dev/null; then
    echo "✅ a2a-sdk is installed"
else
    echo "❌ a2a-sdk not found. Installing..."
    uv pip install a2a-sdk
fi

echo ""
echo "🌐 USE_REMOTE_AGENTS=true"
echo ""
echo "Starting chat agent..."
echo "Access at: http://localhost:8000"
echo ""

export USE_REMOTE_AGENTS=true
adk web
