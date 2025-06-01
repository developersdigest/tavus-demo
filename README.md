# Tavus AI Avatar WebRTC App

A Next.js application for real-time conversations with AI avatars powered by Tavus.

## Features

- 🎥 Real-time WebRTC video conversations with AI avatars
- 🤖 Persona management - create and customize AI personalities
- 💬 Low-latency conversational AI with natural turn-taking
- 🎨 Modern, responsive UI with dark mode support
- 🔧 Easy integration with Tavus Conversational Video Interface (CVI)

## Prerequisites

- Node.js 18+ or Bun
- A Tavus account with API access
- A trained Tavus replica (avatar)

## Setup

1. Clone the repository and install dependencies:
```bash
npm install
# or
bun install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_api_key_here
NEXT_PUBLIC_TAVUS_API_URL=https://api.tavus.io
```

3. Get your Tavus API key from [platform.tavus.io](https://platform.tavus.io)

4. Create a replica (avatar) in your Tavus dashboard if you haven't already

## Running the App

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the app.

## Usage

1. Enter your Replica ID (found in your Tavus dashboard)
2. Optionally create or select a persona to customize the AI's behavior
3. Click "Start Conversation" to begin the WebRTC session
4. Allow camera and microphone permissions when prompted
5. Have a natural conversation with your AI avatar!

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main conversation interface
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── TavusConversation.tsx  # WebRTC conversation component
│   └── PersonaManager.tsx     # Persona creation/selection UI
├── lib/                   # Utilities and services
│   └── tavus.ts          # Tavus API integration
└── .env.local            # Environment variables (create this)
```

## API Integration

The app uses Tavus CVI (Conversational Video Interface) which provides:
- WebRTC infrastructure via Daily
- Speech recognition with interruption handling
- Multimodal perception (facial expressions, body language)
- Sub-1 second utterance-to-utterance latency
- Customizable LLM and TTS layers

## Customization

### Creating Personas

Use the Persona Manager to create custom AI personalities with:
- System prompts to define behavior
- Context for domain-specific knowledge
- Custom greetings
- Vision capabilities
- Turn-taking sensitivity settings

### Styling

The app uses Tailwind CSS for styling. Modify the components to match your brand.

## Learn More

- [Tavus Documentation](https://docs.tavus.io)
- [Tavus CVI Overview](https://docs.tavus.io/sections/conversational-video-interface/cvi-overview)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues with:
- Tavus API: Contact Tavus support or check their documentation
- This app: Open an issue in this repository# tavus-demo
