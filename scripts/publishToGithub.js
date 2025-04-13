const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const winston = require('winston');
require('dotenv').config();

// Configurazione logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ // Aggiungiamo il log sulla console
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configurazione Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = process.env.GITHUB_USERNAME;
const REPO_NAME = 'daily-app-ideas';
const IDEAS_DIR = path.join(__dirname, '../logs/ideas');
const PUBLISHED_FLAG = '_published';

async function createGitHubIssue(idea) {
  const { title, description, category, target_audience, unique_value, monetization, marketing_strategy, development_roadmap } = idea;
  
  const body = `
# ${title}

## Categoria
${category.name}

## Descrizione
${description}

## Target Audience
${target_audience}

## Valore Unico
${unique_value}

## Strategia di Monetizzazione
${monetization}

## Strategia di Marketing
${marketing_strategy}

## Roadmap di Sviluppo
${development_roadmap}

---
*Generato automaticamente dal Daily App Idea Generator*
`;

  try {
    const response = await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `[${category.name}] ${title}`,
      body,
      labels: [category.name]
    });

    logger.info(`Issue creata con successo: ${response.data.html_url}`);
    return response.data.html_url;
  } catch (error) {
    logger.error('Errore durante la creazione dell\'issue:', error);
    throw error;
  }
}

async function publishUnpublishedIdeas() {
  try {
    const files = await fs.readdir(IDEAS_DIR);
    const ideaFiles = files.filter(file => 
      file.endsWith('.json') && !file.includes(PUBLISHED_FLAG)
    );

    for (const file of ideaFiles) {
      const filePath = path.join(IDEAS_DIR, file);
      const publishedFilePath = path.join(
        IDEAS_DIR,
        file.replace('.json', `${PUBLISHED_FLAG}.json`)
      );

      const ideaContent = await fs.readFile(filePath, 'utf8');
      const idea = JSON.parse(ideaContent);

      const issueUrl = await createGitHubIssue(idea);
      
      // Aggiunge l'URL dell'issue all'idea e salva come pubblicata
      idea.github_issue_url = issueUrl;
      await fs.writeFile(publishedFilePath, JSON.stringify(idea, null, 2));
      await fs.unlink(filePath);

      logger.info(`Idea pubblicata e marcata come completata: ${file}`);
    }
  } catch (error) {
    logger.error('Errore durante la pubblicazione delle idee:', error);
    throw error;
  }
}

async function fetchExistingIdeas() {
  try {
    logger.info('Recupero idee esistenti da GitHub...');
    
    const issues = await octokit.paginate(octokit.issues.listForRepo, {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'all',
      per_page: 100
    });

    const existingIdeas = issues.map(issue => ({
      title: issue.title.replace(/^\[.*?\]\s*/, ''), // Rimuove il prefisso della categoria
      category: issue.title.match(/^\[(.*?)\]/)?.[1] || '',
      body: issue.body,
      url: issue.html_url,
      created_at: issue.created_at
    }));

    logger.info(`Recuperate ${existingIdeas.length} idee esistenti`);
    return existingIdeas;
  } catch (error) {
    logger.error('Errore durante il recupero delle idee esistenti:', error);
    throw error;
  }
}

// Esporta le funzioni
module.exports = {
  publishUnpublishedIdeas,
  fetchExistingIdeas
};

// Se eseguito direttamente
if (require.main === module) {
  publishUnpublishedIdeas().catch(error => {
    logger.error('❌ Errore fatale:', error);
    process.exit(1);
  });
} 