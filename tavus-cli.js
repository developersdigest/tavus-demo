#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import FirecrawlApp from '@mendable/firecrawl-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from both .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

const program = new Command();

// Helper functions
const checkApiKeys = async () => {
  let config = {
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    NEXT_PUBLIC_TAVUS_API_KEY: process.env.NEXT_PUBLIC_TAVUS_API_KEY,
    NEXT_PUBLIC_TAVUS_REPLICA_ID: process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID
  };

  const missing = [];
  
  // Check and prompt for missing keys
  if (!config.FIRECRAWL_API_KEY) {
    const { firecrawlKey } = await inquirer.prompt([{
      type: 'input',
      name: 'firecrawlKey',
      message: 'Enter your Firecrawl API key (get one at https://www.firecrawl.dev/):',
      validate: input => input.length > 0 || 'API key is required'
    }]);
    config.FIRECRAWL_API_KEY = firecrawlKey;
    process.env.FIRECRAWL_API_KEY = firecrawlKey;
  }
  
  // Ask for LLM provider if not set
  if (!process.env.LLM_PROVIDER) {
    const { llmProvider } = await inquirer.prompt([{
      type: 'list',
      name: 'llmProvider',
      message: 'Which LLM provider would you like to use?',
      choices: [
        { name: 'OpenAI (GPT-4o)', value: 'openai' },
        { name: 'Google Gemini (Flash)', value: 'gemini' }
      ]
    }]);
    config.LLM_PROVIDER = llmProvider;
    process.env.LLM_PROVIDER = llmProvider;
  }
  
  // Check for LLM API key based on provider
  if (config.LLM_PROVIDER === 'openai' && !config.OPENAI_API_KEY) {
    const { openaiKey } = await inquirer.prompt([{
      type: 'input',
      name: 'openaiKey',
      message: 'Enter your OpenAI API key (get one at https://platform.openai.com/api-keys):',
      validate: input => input.length > 0 || 'API key is required'
    }]);
    config.OPENAI_API_KEY = openaiKey;
    process.env.OPENAI_API_KEY = openaiKey;
  } else if (config.LLM_PROVIDER === 'gemini' && !config.GOOGLE_API_KEY) {
    const { googleKey } = await inquirer.prompt([{
      type: 'input',
      name: 'googleKey',
      message: 'Enter your Google AI API key (get one at https://makersuite.google.com/app/apikey):',
      validate: input => input.length > 0 || 'API key is required'
    }]);
    config.GOOGLE_API_KEY = googleKey;
    process.env.GOOGLE_API_KEY = googleKey;
  }
  
  if (!config.NEXT_PUBLIC_TAVUS_API_KEY) {
    const { tavusKey } = await inquirer.prompt([{
      type: 'input',
      name: 'tavusKey',
      message: 'Enter your Tavus API key:',
      validate: input => input.length > 0 || 'API key is required'
    }]);
    config.NEXT_PUBLIC_TAVUS_API_KEY = tavusKey;
    process.env.NEXT_PUBLIC_TAVUS_API_KEY = tavusKey;
  }
  
  if (!config.NEXT_PUBLIC_TAVUS_REPLICA_ID) {
    const { replicaId } = await inquirer.prompt([{
      type: 'input',
      name: 'replicaId',
      message: 'Enter your Tavus Replica ID:',
      validate: input => input.length > 0 || 'Replica ID is required'
    }]);
    config.NEXT_PUBLIC_TAVUS_REPLICA_ID = replicaId;
    process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID = replicaId;
  }
  
  // Automatically save to appropriate env file
  const envContent = `# Firecrawl API Key
FIRECRAWL_API_KEY=${config.FIRECRAWL_API_KEY}

# LLM Provider Configuration
LLM_PROVIDER=${config.LLM_PROVIDER}

# OpenAI API Key
OPENAI_API_KEY=${config.OPENAI_API_KEY || ''}

# Google AI API Key
GOOGLE_API_KEY=${config.GOOGLE_API_KEY || ''}

# Tavus Configuration
NEXT_PUBLIC_TAVUS_API_KEY=${config.NEXT_PUBLIC_TAVUS_API_KEY}
NEXT_PUBLIC_TAVUS_REPLICA_ID=${config.NEXT_PUBLIC_TAVUS_REPLICA_ID}

# Optional: Specific persona ID
NEXT_PUBLIC_TAVUS_PERSONA_ID=${process.env.NEXT_PUBLIC_TAVUS_PERSONA_ID || ''}
`;
  
  // Determine which file to use
  const hasEnvLocal = existsSync('.env.local');
  const hasEnv = existsSync('.env');
  const targetFile = hasEnvLocal ? '.env.local' : (hasEnv ? '.env' : '.env.local');
  
  if (existsSync(targetFile)) {
    // Append to existing file
    const existingContent = readFileSync(targetFile, 'utf-8');
    const updatedContent = existingContent + '\n\n# Updated by tavus-cli\n' + envContent;
    writeFileSync(targetFile, updatedContent);
    console.log(chalk.green(`✅ API keys updated in ${targetFile}`));
  } else {
    // Create new file
    writeFileSync(targetFile, envContent);
    console.log(chalk.green(`✅ API keys saved to ${targetFile}`));
  }

  return { missing: [], config };
};

const saveContext = (contextData) => {
  const contextDir = join(process.cwd(), 'public', 'tavus-context');
  if (!existsSync(contextDir)) {
    mkdirSync(contextDir, { recursive: true });
  }
  
  const contextPath = join(contextDir, 'current-context.json');
  writeFileSync(contextPath, JSON.stringify(contextData, null, 2));
  
  return contextPath;
};

const generateKnowledgeBase = async (scrapedContent, websiteUrl, llmProvider, apiKey) => {
  const spinner = ora('Generating knowledge base...').start();
  
  try {
    let knowledgeBase = '';
    
    const prompt = `You are creating a comprehensive knowledge base for a Tavus AI persona based on the following scraped website content. 
    The website URL is: ${websiteUrl}
    
    IMPORTANT: Write everything in natural, conversational language. Avoid technical jargon, code snippets, or overly formal language. Write as if you're explaining the website to a friend.
    
    Please analyze all the content and create a well-structured knowledge base that includes:
    1. A friendly introduction to what this website/company is all about
    2. The main things they offer (products, services, features)
    3. What makes them special or different
    4. How people can get help or contact them
    5. Any important things people should know (like policies, but explained simply)
    6. Any other helpful information for someone learning about this company
    
    Write in a warm, approachable tone. Use simple language and short sentences. Make it easy to understand for anyone, regardless of their technical background.
    
    Format with markdown headers and lists for organization, but keep the content itself conversational and human-friendly.
    
    Here is the scraped content:
    
    ${scrapedContent}`;

    if (llmProvider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      knowledgeBase = result.response.text();
    } else {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly assistant that creates knowledge bases in natural, conversational language. Always write as if explaining to a friend - warm, simple, and approachable. Avoid technical jargon and formal corporate speak.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });
      knowledgeBase = completion.choices[0].message.content;
    }
    
    spinner.succeed('Knowledge base generated successfully');
    return knowledgeBase;
  } catch (error) {
    spinner.fail('Failed to generate knowledge base');
    throw error;
  }
};

const crawlWebsite = async (websiteUrl, mode = 'crawl', pages = [], maxPages = 10) => {
  const spinner = ora(`Starting ${mode} process...`).start();
  
  try {
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    let scrapedPages = [];
    
    if (mode === 'crawl') {
      // Crawl mode - automatically discover and scrape pages
      spinner.text = 'Crawling website...';
      
      const crawlResult = await app.crawlUrl(websiteUrl, {
        limit: maxPages,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      });
      
      if (crawlResult.success && crawlResult.data) {
        scrapedPages = crawlResult.data.slice(0, maxPages).map(page => ({
          url: page.metadata?.sourceURL || page.url,
          content: page.markdown || page.content || ''
        }));
      }
    } else if (mode === 'batch' && pages.length > 0) {
      // Batch scrape mode - scrape specific pages
      spinner.text = 'Batch scraping pages...';
      
      for (const pageUrl of pages) {
        try {
          const scrapeResult = await app.scrapeUrl(pageUrl, {
            formats: ['markdown'],
            onlyMainContent: true
          });
          
          if (scrapeResult.success && scrapeResult.data) {
            scrapedPages.push({
              url: pageUrl,
              content: scrapeResult.data.markdown || scrapeResult.data.content || ''
            });
          }
        } catch (error) {
          console.warn(chalk.yellow(`\nFailed to scrape ${pageUrl}: ${error.message}`));
        }
      }
    } else {
      // Single page scrape
      spinner.text = 'Scraping page...';
      
      const scrapeResult = await app.scrapeUrl(websiteUrl, {
        formats: ['markdown'],
        onlyMainContent: true
      });
      
      if (scrapeResult.success && scrapeResult.data) {
        scrapedPages.push({
          url: websiteUrl,
          content: scrapeResult.data.markdown || scrapeResult.data.content || ''
        });
      }
    }
    
    spinner.succeed(`Successfully scraped ${scrapedPages.length} pages`);
    return scrapedPages;
  } catch (error) {
    spinner.fail('Scraping failed');
    throw error;
  }
};

const createContext = async () => {
  console.log(chalk.blue.bold('\n🤖 Tavus AI Context Creator\n'));
  
  // Check API keys - this will now prompt for missing ones
  const { missing, config } = await checkApiKeys();
  
  // Get scraping mode
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'How would you like to gather content?',
      choices: [
        { name: 'Crawl website (auto-discover pages)', value: 'crawl' },
        { name: 'Scrape specific pages', value: 'batch' },
        { name: 'Scrape single page', value: 'single' }
      ]
    }
  ]);
  
  let websiteUrl, pages = [], maxPages = 10;
  
  if (mode === 'crawl') {
    const crawlAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'websiteUrl',
        message: 'Enter the website URL to crawl:',
        validate: input => input.startsWith('http') || 'Please enter a valid URL'
      },
      {
        type: 'number',
        name: 'maxPages',
        message: 'Maximum number of pages to crawl:',
        default: 10
      }
    ]);
    websiteUrl = crawlAnswers.websiteUrl;
    maxPages = crawlAnswers.maxPages;
  } else if (mode === 'batch') {
    const batchAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'websiteUrl',
        message: 'Enter the main website URL (for context):',
        validate: input => input.startsWith('http') || 'Please enter a valid URL'
      },
      {
        type: 'editor',
        name: 'pagesList',
        message: 'Enter page URLs (one per line):'
      }
    ]);
    websiteUrl = batchAnswers.websiteUrl;
    pages = batchAnswers.pagesList.split('\n').filter(url => url.trim());
  } else {
    const singleAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'websiteUrl',
        message: 'Enter the page URL to scrape:',
        validate: input => input.startsWith('http') || 'Please enter a valid URL'
      }
    ]);
    websiteUrl = singleAnswers.websiteUrl;
  }
  
  // Get persona details
  // Extract domain name and capitalize it
  const domain = new URL(websiteUrl).hostname.replace('www.', '');
  const domainName = domain.split('.')[0];
  const defaultPersonaName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
  
  const { personaName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'personaName',
      message: 'Enter a name for this persona:',
      default: defaultPersonaName
    }
  ]);
  
  try {
    // Scrape content
    const scrapedPages = await crawlWebsite(websiteUrl, mode, pages, maxPages);
    
    if (scrapedPages.length === 0) {
      console.log(chalk.red('❌ No pages were successfully scraped'));
      process.exit(1);
    }
    
    // Format scraped content
    const formattedContent = `=== TAVUS SCRAPED PAGES ===
Generated: ${new Date().toISOString()}
Total Pages: ${scrapedPages.length}

${scrapedPages.map((page, index) => 
`Page ${index + 1}: ${page.title || 'undefined'}
URL: ${page.url || 'undefined'}
Content:
${page.content}

${'='.repeat(80)}`
).join('\n\n')}`;
    
    // Generate knowledge base
    const knowledgeBase = await generateKnowledgeBase(
      formattedContent,
      websiteUrl,
      config.LLM_PROVIDER,
      config.LLM_PROVIDER === 'gemini' ? config.GOOGLE_API_KEY : config.OPENAI_API_KEY
    );
    
    // Calculate context size
    const contextSize = Buffer.from(formattedContent + knowledgeBase).length;
    
    // Create context object
    const contextData = {
      personaId: process.env.NEXT_PUBLIC_TAVUS_PERSONA_ID || '',
      personaName,
      websiteUrl,
      createdAt: new Date().toISOString(),
      contextSize,
      pagesIncluded: scrapedPages.length,
      knowledgeBase,
      scrapedContent: formattedContent
    };
    
    // Save context
    const savedPath = saveContext(contextData);
    console.log(chalk.green(`\n✅ Context saved to: ${savedPath}`));
    console.log(chalk.blue(`   Total pages: ${scrapedPages.length}`));
    console.log(chalk.blue(`   Context size: ${(contextSize / 1024).toFixed(2)} KB`));
    
    // Ask about next steps
    const { nextAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'nextAction',
        message: '\nWhat would you like to do next?',
        choices: [
          { name: 'Start development server', value: 'dev' },
          { name: 'Deploy to Vercel', value: 'deploy' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);
    
    if (nextAction === 'dev') {
      console.log(chalk.blue('\n🚀 Starting development server...\n'));
      const dev = spawn('npm', ['run', 'dev'], { 
        stdio: 'inherit',
        shell: true 
      });
      
      dev.on('error', (error) => {
        console.error(chalk.red(`Failed to start dev server: ${error.message}`));
      });
    } else if (nextAction === 'deploy') {
      await deployToVercel();
    }
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};

const deployToVercel = async () => {
  const spinner = ora('Preparing for Vercel deployment...').start();
  
  try {
    // Check if Vercel CLI is installed
    const vercelCheck = spawn('vercel', ['--version'], { shell: true });
    
    vercelCheck.on('error', () => {
      spinner.fail('Vercel CLI not found. Please install it with: npm i -g vercel');
      process.exit(1);
    });
    
    vercelCheck.on('close', async (code) => {
      if (code !== 0) {
        spinner.fail('Vercel CLI not found. Please install it with: npm i -g vercel');
        process.exit(1);
      }
      
      spinner.succeed('Vercel CLI found');
      
      // Deploy with environment variables
      console.log(chalk.blue('\n🚀 Deploying to Vercel...\n'));
      
      const envVars = [
        `NEXT_PUBLIC_TAVUS_API_KEY=${process.env.NEXT_PUBLIC_TAVUS_API_KEY}`,
        `NEXT_PUBLIC_TAVUS_REPLICA_ID=${process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID}`,
        `NEXT_PUBLIC_TAVUS_PERSONA_ID=${process.env.NEXT_PUBLIC_TAVUS_PERSONA_ID || ''}`,
        `FIRECRAWL_API_KEY=${process.env.FIRECRAWL_API_KEY}`,
        `OPENAI_API_KEY=${process.env.OPENAI_API_KEY || ''}`,
        `GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY || ''}`
      ];
      
      const vercelArgs = ['--prod'];
      envVars.forEach(envVar => {
        vercelArgs.push('-e', envVar);
      });
      
      const deploy = spawn('vercel', vercelArgs, { 
        stdio: 'inherit',
        shell: true 
      });
      
      deploy.on('error', (error) => {
        console.error(chalk.red(`Deployment failed: ${error.message}`));
      });
      
      deploy.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('\n✅ Deployment successful!'));
        } else {
          console.log(chalk.red('\n❌ Deployment failed'));
        }
      });
    });
    
  } catch (error) {
    spinner.fail(`Deployment preparation failed: ${error.message}`);
    process.exit(1);
  }
};

// CLI setup
program
  .name('tavus-cli')
  .description('CLI tool for creating and managing Tavus AI persona contexts')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new Tavus persona context')
  .action(createContext);

program
  .command('dev')
  .description('Start the development server')
  .action(() => {
    console.log(chalk.blue('\n🚀 Starting development server...\n'));
    const dev = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      shell: true 
    });
    
    dev.on('error', (error) => {
      console.error(chalk.red(`Failed to start dev server: ${error.message}`));
    });
  });

program
  .command('deploy')
  .description('Deploy to Vercel with environment variables')
  .action(deployToVercel);

program
  .command('check-env')
  .description('Check if all required environment variables are set')
  .action(async () => {
    // Simple check without prompting
    const config = {
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      NEXT_PUBLIC_TAVUS_API_KEY: process.env.NEXT_PUBLIC_TAVUS_API_KEY,
      NEXT_PUBLIC_TAVUS_REPLICA_ID: process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID
    };
    
    const missing = [];
    if (!config.FIRECRAWL_API_KEY) missing.push('FIRECRAWL_API_KEY');
    if (config.LLM_PROVIDER === 'openai' && !config.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
    if (config.LLM_PROVIDER === 'gemini' && !config.GOOGLE_API_KEY) missing.push('GOOGLE_API_KEY');
    if (!config.NEXT_PUBLIC_TAVUS_API_KEY) missing.push('NEXT_PUBLIC_TAVUS_API_KEY');
    if (!config.NEXT_PUBLIC_TAVUS_REPLICA_ID) missing.push('NEXT_PUBLIC_TAVUS_REPLICA_ID');
    
    if (missing.length === 0) {
      console.log(chalk.green('\n✅ All required API keys are set!'));
      console.log(chalk.blue('\nCurrent configuration:'));
      console.log(chalk.gray(`  LLM Provider: ${config.LLM_PROVIDER}`));
      console.log(chalk.gray(`  Tavus API Key: ${config.NEXT_PUBLIC_TAVUS_API_KEY.substring(0, 10)}...`));
      console.log(chalk.gray(`  Tavus Replica ID: ${config.NEXT_PUBLIC_TAVUS_REPLICA_ID}`));
    } else {
      console.log(chalk.red('\n❌ Missing required API keys:'));
      missing.forEach(key => console.log(chalk.red(`   - ${key}`)));
      console.log(chalk.yellow('\nPlease add these to your .env or .env.local file, or run "tavus-cli create" to be prompted for them'));
      console.log(chalk.gray('\nExample .env or .env.local file:'));
      console.log(chalk.gray('FIRECRAWL_API_KEY=your_firecrawl_key'));
      console.log(chalk.gray('OPENAI_API_KEY=your_openai_key'));
      console.log(chalk.gray('GOOGLE_API_KEY=your_google_key'));
      console.log(chalk.gray('LLM_PROVIDER=openai # or gemini'));
      console.log(chalk.gray('NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_key'));
      console.log(chalk.gray('NEXT_PUBLIC_TAVUS_REPLICA_ID=your_replica_id'));
      console.log(chalk.gray('NEXT_PUBLIC_TAVUS_PERSONA_ID=optional_persona_id'));
    }
  });

program.parse();