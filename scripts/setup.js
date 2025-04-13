const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'setup.log', level: 'error' }),
        new winston.transports.Console()
    ]
});

async function setupEnvironment() {
    try {
        // Crea directory necessarie
        const directories = [
            'templates',
            'test_data',
            'logs'
        ];

        for (const dir of directories) {
            await fs.mkdir(path.join(__dirname, '..', dir), { recursive: true });
            logger.info(`Directory ${dir} creata`);
        }

        // Verifica/Crea template
        const templatePath = path.join(__dirname, '..', 'templates', 'idea_template.json');
        try {
            await fs.access(templatePath);
            logger.info('Template esistente trovato');
        } catch {
            const templateContent = {
                "description": "Un'applicazione {idea} che aiuta gli utenti a gestire e organizzare le loro attività quotidiane in modo efficiente.",
                "mainObjective": "fornire una soluzione completa per la gestione delle attività personali e professionali",
                "keyFeatures": [
                    "Interfaccia utente intuitiva e responsive",
                    "Sincronizzazione multi-dispositivo",
                    "Notifiche personalizzabili",
                    "Integrazione con calendari esterni",
                    "Analisi delle performance e statistiche"
                ],
                "technicalRequirements": {
                    "language": "JavaScript",
                    "framework": "React",
                    "database": "MongoDB",
                    "externalAPIs": [
                        "Google Calendar API",
                        "Slack API",
                        "Email API"
                    ]
                }
            };

            await fs.writeFile(templatePath, JSON.stringify(templateContent, null, 2));
            logger.info('Template creato con successo');
        }

        // Verifica dipendenze
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = require(packageJsonPath);

        const requiredDependencies = [
            'winston',
            'jest',
            'node-cron'
        ];

        const missingDependencies = requiredDependencies.filter(dep => 
            !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
        );

        if (missingDependencies.length > 0) {
            logger.warn(`Dipendenze mancanti: ${missingDependencies.join(', ')}`);
            logger.info('Eseguire: npm install ' + missingDependencies.join(' '));
        }

        logger.info('Setup completato con successo');
    } catch (error) {
        logger.error('Errore durante il setup:', error);
        process.exit(1);
    }
}

// Esegui lo setup se il file viene eseguito direttamente
if (require.main === module) {
    setupEnvironment();
}

module.exports = { setupEnvironment }; 