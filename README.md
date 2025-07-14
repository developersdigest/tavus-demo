# Tavus AI Assistant

A Next.js application that creates AI-powered conversational agents using the Tavus API, with the ability to automatically generate knowledge bases from websites.

## Overview

This project combines web scraping, AI-powered knowledge base generation, and Tavus's conversational AI to create intelligent chatbots that can answer questions about any website or product. The system includes a CLI tool for creating contexts and a web interface for interacting with the AI assistant.

## Features

- **Automated Knowledge Base Creation**: Scrape websites and generate comprehensive knowledge bases using AI 
- **Multiple Scraping Modes**: Crawl entire sites, batch scrape specific pages, or process single URLs
- **AI-Powered Context Generation**: Use OpenAI GPT-4o or Google Gemini to create structured knowledge bases
- **Real-Time Conversations**: Interactive chat interface powered by Tavus AI
- **Context Management**: Tools to manage and view created contexts
- **Easy Deployment**: One-command deployment to Vercel with environment variables

## Prerequisites

- Node.js 18+
- npm or yarn
- API keys for:
  - [Tavus](https://tavus.io) - For AI conversations
  - [Firecrawl](https://www.firecrawl.dev/) - For web scraping
  - [OpenAI](https://platform.openai.com) or [Google AI](https://makersuite.google.com) - For knowledge base generation

## Quick Start

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd tavus
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Create a knowledge base:**
```bash
npm run tavus-cli create
```

4. **Start the development server:**
```bash
npm run dev
```

Visit http://localhost:3000 to interact with your AI assistant.

## Environment Variables

Create a `.env` file with the following:

```env
# Tavus Configuration
TAVUS_API_KEY=your_tavus_api_key
TAVUS_REPLICA_ID=your_replica_id
TAVUS_PERSONA_ID=your_persona_id (optional)

# Web Scraping
FIRECRAWL_API_KEY=your_firecrawl_key

# AI Provider (choose one)
OPENAI_API_KEY=your_openai_key
# OR
GOOGLE_AI_API_KEY=your_google_ai_key

# Public Environment Variables for Client
NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_api_key
NEXT_PUBLIC_TAVUS_REPLICA_ID=your_replica_id
NEXT_PUBLIC_TAVUS_PERSONA_ID=your_persona_id (optional)
```

## CLI Commands

### Create a New Context
```bash
npm run tavus-cli create
```
Interactive wizard that guides you through:
- Choosing scraping mode (crawl/batch/single)
- Entering website URLs
- Setting persona name
- Generating knowledge base

### Manage Contexts
```bash
# Show all contexts
npm run context:show

# View detailed context information
npm run context:view

# Clean up old contexts
npm run context:cleanup
```

### Debug Tools
```bash
# Check environment setup and API connections
npm run debug-persona

# Check specific environment variables
npm run tavus-cli check-env
```

## Project Structure

```
tavus/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main chat interface
│   ├── layout.tsx         # App layout
│   └── globals.css        # Global styles
├── public/
│   └── tavus-context/     # Stored contexts
│       └── current-context.json
├── tavus-cli.js           # CLI tool for context creation
├── manage-context.js      # Context management tool
├── debug-persona.js       # Debugging utility
└── setup-vercel.sh        # Vercel deployment script
```

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
npm run tavus-cli deploy
# or
vercel
```

3. **Set environment variables in Vercel dashboard or via CLI:**
```bash
vercel env add NEXT_PUBLIC_TAVUS_API_KEY
vercel env add NEXT_PUBLIC_TAVUS_REPLICA_ID
```

### Deploy to Other Platforms

1. Build the application:
```bash
npm run build
```

2. Set environment variables in your platform's dashboard

3. Deploy the `.next` directory

## Usage Guide

### Creating Your First AI Assistant

1. **Run the CLI tool:**
```bash
npm run tavus-cli create
```

2. **Choose scraping mode:**
   - **Crawl**: Automatically discover and scrape pages (best for complete documentation)
   - **Batch**: Scrape specific URLs you provide (best for key pages)
   - **Single**: Scrape one URL (best for testing)

3. **Enter website details and generate the knowledge base**

4. **Start chatting with your AI assistant**

### Best Practices

- **Context Size**: Keep under 100KB for optimal performance
- **Page Selection**: Choose pages that best represent your product/service:
  - Homepage
  - About/Company page
  - Product/Service pages
  - Pricing
  - FAQ/Support
- **LLM Provider**: 
  - Use OpenAI GPT-4o for best quality
  - Use Google Gemini Flash for faster/cheaper generation

## Troubleshooting

### Common Issues

1. **"No context found" error**
   - Run `npm run tavus-cli create` to generate a context
   - Check that `public/tavus-context/current-context.json` exists

2. **Tavus conversation not loading**
   - Verify API keys are correct
   - Check browser console for errors
   - Ensure you're not exceeding concurrent conversation limits

3. **Web scraping fails**
   - Verify Firecrawl API key
   - Try reducing the number of pages
   - Check if the website blocks scraping

4. **Knowledge base generation fails**
   - Ensure AI provider API key is set
   - Check API rate limits
   - Verify scraped content is not empty

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [troubleshooting guide](#troubleshooting)
- Open an issue on GitHub

---

Built with [Next.js](https://nextjs.org), [Tavus AI](https://tavus.io), and [Firecrawl](https://firecrawl.dev)
