import Link from 'next/link';

export default function HostedToolsHome() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Firecrawl Hosted Tools</h1>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <Link href="/hostedTools/tavus" className="text-blue-600 hover:underline">Tavus Demo</Link>
        </li>
      </ul>
    </div>
  );
}
