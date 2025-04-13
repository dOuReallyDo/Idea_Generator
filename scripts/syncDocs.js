const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const winston = require('winston');

// Configurazione logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/sync.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console()
    ]
});

// Configurazione Octokit
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

async function syncDocumentation() {
    try {
        logger.info('Inizio sincronizzazione documentazione');

        // Leggi tutti i file nella directory docs
        const docsPath = path.join(__dirname, '..', 'docs');
        const files = await fs.readdir(docsPath, { recursive: true });

        for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.html')) {
                const filePath = path.join(docsPath, file);
                const content = await fs.readFile(filePath, 'utf8');

                // Crea o aggiorna il file su GitHub
                await octokit.repos.createOrUpdateFileContents({
                    owner: process.env.GITHUB_OWNER,
                    repo: process.env.GITHUB_REPO,
                    path: `docs/${file}`,
                    message: `Aggiornamento documentazione: ${file}`,
                    content: Buffer.from(content).toString('base64'),
                    branch: 'main'
                });

                logger.info(`File sincronizzato: ${file}`);
            }
        }

        logger.info('Sincronizzazione documentazione completata');
    } catch (error) {
        logger.error('Errore nella sincronizzazione:', error);
        throw error;
    }
}

// Esegui la sincronizzazione se lo script è eseguito direttamente
if (require.main === module) {
    syncDocumentation().catch(error => {
        logger.error('Errore fatale:', error);
        process.exit(1);
    });
}

module.exports = {
    syncDocumentation
}; 