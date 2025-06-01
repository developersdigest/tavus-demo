import { ScrapingJob, PersonaContext } from '@/types/scraping';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'scraping-jobs.json');
const PERSONAS_FILE = path.join(DATA_DIR, 'persona-contexts.json');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function saveScrapingJob(job: ScrapingJob): Promise<void> {
  await ensureDataDir();
  
  const jobs = await getAllScrapingJobs();
  const existingIndex = jobs.findIndex(j => j.id === job.id);
  
  if (existingIndex >= 0) {
    jobs[existingIndex] = job;
  } else {
    jobs.push(job);
  }
  
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export async function getScrapingJob(id: string): Promise<ScrapingJob | null> {
  const jobs = await getAllScrapingJobs();
  return jobs.find(j => j.id === id) || null;
}

export async function getAllScrapingJobs(): Promise<ScrapingJob[]> {
  await ensureDataDir();
  
  try {
    const data = await fs.readFile(JOBS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function savePersonaContext(context: PersonaContext): Promise<void> {
  await ensureDataDir();
  
  const contexts = await getAllPersonaContexts();
  const existingIndex = contexts.findIndex(c => c.websiteUrl === context.websiteUrl);
  
  if (existingIndex >= 0) {
    contexts[existingIndex] = context;
  } else {
    contexts.push(context);
  }
  
  await fs.writeFile(PERSONAS_FILE, JSON.stringify(contexts, null, 2));
}

export async function getPersonaContext(websiteUrl: string): Promise<PersonaContext | null> {
  const contexts = await getAllPersonaContexts();
  return contexts.find(c => c.websiteUrl === websiteUrl) || null;
}

export async function getAllPersonaContexts(): Promise<PersonaContext[]> {
  await ensureDataDir();
  
  try {
    const data = await fs.readFile(PERSONAS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}