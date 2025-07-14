#!/bin/bash

echo "🚀 Setting up Vercel deployment with environment variables..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "📋 Reading environment variables from .env.local..."

# Function to add env var to Vercel
add_vercel_env() {
    local key=$1
    local value=$2
    
    echo "  → Adding $key to Vercel..."
    # Add to all environments separately
    echo "$value" | vercel env add "$key" production 2>&1 | grep -v "Vercel CLI" || true
    echo "$value" | vercel env add "$key" preview 2>&1 | grep -v "Vercel CLI" || true
    echo "$value" | vercel env add "$key" development 2>&1 | grep -v "Vercel CLI" || true
}

# Read .env.local and add variables to Vercel
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Add to Vercel
    if [[ -n "$value" ]]; then
        add_vercel_env "$key" "$value"
    fi
done < .env.local

echo ""
echo "✅ Environment variables added to Vercel!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'vercel' to deploy your project"
echo "2. Or run 'vercel --prod' for production deployment"
echo ""
echo "💡 Tip: You can also manually manage env vars at:"
echo "   https://vercel.com/[your-username]/[your-project]/settings/environment-variables"