# Tavus AI Assistant

A Next.js application that creates AI-powered conversational agents using the Tavus API.

## Prerequisites

- Node.js 18+
- API keys from:
  - [Tavus](https://tavus.io)
  - [Firecrawl](https://www.firecrawl.dev/)
  - [OpenAI](https://platform.openai.com) or [Google AI](https://makersuite.google.com)

## Quick Start

1. **Clone and install:**
```bash
git clone <repository-url>
cd tavus-demo
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Add your API keys to .env
```

3. **Create a knowledge base:**
```bash
npm run tavus-cli create
```

4. **Start the app:**
```bash
npm run dev
```

## Environment Variables

```env
# Required
TAVUS_API_KEY=your_tavus_api_key
TAVUS_REPLICA_ID=your_replica_id
FIRECRAWL_API_KEY=your_firecrawl_key

# Choose one
OPENAI_API_KEY=your_openai_key
# OR
GOOGLE_AI_API_KEY=your_google_ai_key

# Client-side
NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_api_key
NEXT_PUBLIC_TAVUS_REPLICA_ID=your_replica_id
```

## Deployment

```bash
vercel
```

## License

MIT