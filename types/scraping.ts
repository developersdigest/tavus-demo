export interface PageData {
  url: string;
  title: string;
  content: string;
  markdown?: string;
  summary?: string;
}

export interface ScrapingJob {
  id: string;
  websiteUrl: string;
  status: 'mapping' | 'scraping' | 'summarizing' | 'completed' | 'error';
  pages: PageData[];
  finalContext?: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  mapId?: string;
  batchScrapeId?: string;
}

export interface PersonaContext {
  websiteUrl: string;
  context: string;
  summaries: { [url: string]: string };
  createdAt: Date;
}