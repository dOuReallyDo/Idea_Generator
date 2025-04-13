const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const winston = require('winston');

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

async function createProjectTemplate(idea) {
  try {
    const projectName = idea.name.toLowerCase().replace(/\s+/g, '-');
    const projectPath = path.join(__dirname, '../templates', projectName);

    // Crea la struttura delle cartelle
    const directories = [
      '',
      'frontend',
      'frontend/src',
      'frontend/public',
      'backend',
      'backend/src',
      'backend/src/routes',
      'backend/src/controllers',
      'backend/src/models',
      'docs'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(projectPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // Crea i file di base
    const files = {
      'README.md': `# ${idea.name}\n\n${idea.problem}\n\n## Funzionalità\n\n${idea.features.map(f => `- ${f}`).join('\n')}`,
      'frontend/package.json': JSON.stringify({
        name: `${projectName}-frontend`,
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        }
      }, null, 2),
      'backend/package.json': JSON.stringify({
        name: `${projectName}-backend`,
        version: '1.0.0',
        scripts: {
          dev: 'nodemon src/index.js',
          start: 'node src/index.js'
        },
        dependencies: {
          'express': '^4.18.2',
          'mongoose': '^8.0.0',
          'dotenv': '^16.3.1'
        },
        devDependencies: {
          'nodemon': '^3.0.0'
        }
      }, null, 2)
    };

    Object.entries(files).forEach(([filePath, content]) => {
      fs.writeFileSync(path.join(projectPath, filePath), content);
    });

    logger.info(`Template creato con successo per: ${idea.name}`);
    return projectPath;
  } catch (error) {
    logger.error('Errore nella creazione del template:', error);
    throw error;
  }
}

module.exports = {
  createProjectTemplate
};

// Se eseguito direttamente
if (require.main === module) {
  const { generateRandomIdea } = require('./generateIdea');
  const idea = generateRandomIdea();
  createProjectTemplate(idea);
} 