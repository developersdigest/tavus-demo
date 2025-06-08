import Link from 'next/link';

export default function HostedToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/hostedTools" className="text-lg font-bold">Firecrawl Hosted Tools</Link>
          <nav className="space-x-4">
            <Link href="/hostedTools/tavus" className="hover:underline">Tavus Demo</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
