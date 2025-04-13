const { Octokit } = require('octokit');
const fs = require('fs');
const path = require('path');
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
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function publishToGithub(projectPath) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const repoName = path.basename(projectPath);
    
    // Crea il repository su GitHub
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: `Idea generata il ${date}`,
      private: false,
      auto_init: true
    });

    // Inizializza Git e pubblica
    const commands = [
      'git init',
      'git add .',
      `git commit -m "Idea generata il ${date}"`,
      `git remote add origin https://github.com/${process.env.GITHUB_USERNAME}/${repoName}.git`,
      'git push -u origin main'
    ];

    commands.forEach(cmd => {
      require('child_process').execSync(cmd, {
        cwd: projectPath,
        stdio: 'inherit'
      });
    });

    logger.info(`Progetto pubblicato con successo su GitHub: ${repoName}`);
    return `https://github.com/${process.env.GITHUB_USERNAME}/${repoName}`;
  } catch (error) {
    logger.error('Errore nella pubblicazione su GitHub:', error);
    throw error;
  }
}

module.exports = {
  publishToGithub
};

// Se eseguito direttamente
if (require.main === module) {
  const { generateRandomIdea } = require('./generateIdea');
  const { createProjectTemplate } = require('./createTemplate');
  
  (async () => {
    try {
      const idea = generateRandomIdea();
      const projectPath = await createProjectTemplate(idea);
      const repoUrl = await publishToGithub(projectPath);
      console.log('Idea di oggi generata e template pubblicato con successo su GitHub:', repoUrl);
    } catch (error) {
      console.error('Errore durante il processo:', error);
      process.exit(1);
    }
  })();
} 