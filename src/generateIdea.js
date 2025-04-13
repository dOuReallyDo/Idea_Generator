const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console()
    ]
});

async function generateDailyIdeas(numIdeas = 3) {
    try {
        const templatePath = path.join(__dirname, '..', 'templates', 'idea_template.json');
        const template = JSON.parse(await fs.readFile(templatePath, 'utf8'));
        
        const ideas = [];
        const today = new Date().toISOString().split('T')[0];
        
        for (let i = 1; i <= numIdeas; i++) {
            const title = `Idea ${i} - ${today}`;
            const timeline = {
                phase1: 1,
                phase2: 5,
                phase3: 1,
                phase4: 1
            };
            const resources = {
                developers: 3,
                designers: 1,
                servers: 1,
                budget: Math.floor(Math.random() * 1000) + 1000
            };
            
            const idea = {
                id: `idea_${Date.now()}_${i}`,
                title: title,
                description: template.description.replace('{idea}', `Idea ${i}`),
                mainObjective: template.mainObjective,
                keyFeatures: template.keyFeatures,
                technicalRequirements: template.technicalRequirements,
                timeline: timeline,
                resources: resources,
                autodev_prompt: `# Prompt per AutoDev - ${title}
## Contesto
${template.description.replace('{idea}', `Idea ${i}`)}

## Obiettivi Principali
1. Sviluppare un'applicazione che ${template.mainObjective}
2. Implementare le seguenti funzionalità chiave:
   ${template.keyFeatures.map(feature => `   - ${feature}`).join('\n   ')}

## Requisiti Tecnici
- Linguaggio di programmazione: ${template.technicalRequirements.language}
- Framework: ${template.technicalRequirements.framework}
- Database: ${template.technicalRequirements.database}
- API esterne: ${template.technicalRequirements.externalAPIs.join(', ')}

## Timeline Stimata
- Fase 1 (Setup): ${timeline.phase1} giorni
- Fase 2 (Sviluppo Core): ${timeline.phase2} giorni
- Fase 3 (Testing): ${timeline.phase3} giorni
- Fase 4 (Deployment): ${timeline.phase4} giorni

## Risorse Necessarie
- Sviluppatori: ${resources.developers}
- Designer: ${resources.designers}
- Server: ${resources.servers}
- Budget: $${resources.budget}

## Note Aggiuntive
Questo progetto è stato generato automaticamente da IdeaGenerator e deve essere sviluppato da AutoDev.
`
            };
            ideas.push(idea);
        }
        
        logger.info(`Generate ${numIdeas} idee`);
        return ideas;
    } catch (error) {
        logger.error('Errore nella generazione delle idee:', error);
        throw error;
    }
}

function generateAutoDevPrompt(idea) {
    return `
    # Prompt per AutoDev - ${idea.title}

    ## Contesto
    ${idea.description}

    ## Obiettivi Principali
    1. Sviluppare un'applicazione che ${idea.mainObjective}
    2. Implementare le seguenti funzionalità chiave:
       ${idea.keyFeatures.map(feat => `- ${feat}`).join('\n       ')}

    ## Requisiti Tecnici
    - Linguaggio di programmazione: ${idea.technicalRequirements.language}
    - Framework: ${idea.technicalRequirements.framework}
    - Database: ${idea.technicalRequirements.database}
    - API esterne: ${idea.technicalRequirements.externalAPIs.join(', ')}

    ## Timeline Stimata
    - Fase 1 (Setup): ${idea.timeline.phase1} giorni
    - Fase 2 (Sviluppo Core): ${idea.timeline.phase2} giorni
    - Fase 3 (Testing): ${idea.timeline.phase3} giorni
    - Fase 4 (Deployment): ${idea.timeline.phase4} giorni

    ## Risorse Necessarie
    - Sviluppatori: ${idea.resources.developers}
    - Designer: ${idea.resources.designers}
    - Server: ${idea.resources.servers}
    - Budget: ${idea.resources.budget}

    ## Note Aggiuntive
    Questo progetto è stato generato automaticamente da IdeaGenerator e deve essere sviluppato da AutoDev.
    `;
}

module.exports = {
    generateDailyIdeas,
    generateAutoDevPrompt
}; 