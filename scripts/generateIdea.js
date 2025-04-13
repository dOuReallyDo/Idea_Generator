const fs = require('fs');
const path = require('path');
const winston = require('winston');
const axios = require('axios');
const { fetchExistingIdeas } = require('./publishToGithub');
const { generateDailyIdeas } = require('../src/generateIdea');
const { publishUnpublishedIdeas } = require('../src/publishToGithub');
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
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Categorie di applicazioni
const categories = {
  'mobile-games': {
    name: 'Giochi Mobile',
    description: 'Giochi facili ma ingaggianti per AppStore e GooglePlay (giochi di carte, tetris-like, breakout, cloni retro, puzzle)',
    examples: ['Solitario moderno', 'Puzzle rilassante', 'Arcade retro', 'Mini rompicapo']
  },
  'daily-utilities': {
    name: 'Utility Quotidiane',
    description: 'App utili per la vita quotidiana (gestione documenti, spese, condivisione)',
    examples: ['Scanner documenti', 'Gestione spese', 'Split spese gruppo']
  },
  'b2b-services': {
    name: 'Servizi B2B',
    description: 'Servizi cloud su Azure/AWS per aziende, organizzazione di informazioni web per il B2B',
    examples: ['Aggregatore dati settore', 'Analytics B2B', 'Dashboard informative']
  },
  'professional-apps': {
    name: 'App Professionali',
    description: 'App tematiche per professionisti (marketing, vendite, finanza, formazione) basate su fonti pubbliche',
    examples: ['Wiki Marketing Mobile', 'Sales Intelligence', 'Knowledge Hub']
  },
  'financial-simulation': {
    name: 'Simulazione Finanziaria',
    description: 'Software per simulazione e gestione portafogli con ML/AI per previsioni di mercato',
    examples: ['Portfolio Simulator', 'Trading Education', 'Market Predictor']
  }
};

// Template per le idee
const ideaTemplate = {
  name: '',
  category: '',
  problem: '',
  target_audience: '',
  unique_value: '',
  features: [],
  technologies: {
    frontend: '',
    backend: '',
    database: '',
    cloud_services: [],
    ai_ml: [],
    other: []
  },
  monetization: '',
  marketing_strategy: '',
  development_roadmap: [],
  userFlow: []
};

async function generateIdeaWithOllama(category, categoryInfo) {
  // Recupera le idee esistenti
  const existingIdeas = await fetchExistingIdeas();
  const existingIdeasInCategory = existingIdeas
    .filter(idea => idea.category === categoryInfo.name)
    .map(idea => idea.title)
    .join('\n- ');

  const prompt = `Genera un'idea innovativa per un'applicazione nella categoria: ${categoryInfo.name}.
  
Descrizione categoria: ${categoryInfo.description}
Esempi simili: ${categoryInfo.examples.join(', ')}

IMPORTANTE: Evita di generare idee simili a quelle già esistenti:
${existingIdeasInCategory ? `- ${existingIdeasInCategory}` : 'Nessuna idea esistente in questa categoria'}

L'idea deve essere COMPLETAMENTE DIVERSA da quelle elencate sopra, sia nel concetto che nell'implementazione.

Rispondi SOLO in formato JSON valido con questa struttura:
{
  "name": "nome creativo dell'app",
  "category": "${categoryInfo.name}",
  "problem": "problema specifico che l'app risolve",
  "target_audience": "descrizione del pubblico target",
  "unique_value": "proposta di valore unica",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "technologies": {
    "frontend": "tecnologia frontend specifica per questa categoria",
    "backend": "tecnologia backend appropriata",
    "database": "database scelto",
    "cloud_services": ["servizio 1", "servizio 2"],
    "ai_ml": ["tecnologia AI/ML 1", "tecnologia AI/ML 2"],
    "other": ["altra tecnologia 1", "altra tecnologia 2"]
  },
  "monetization": "strategia di monetizzazione",
  "marketing_strategy": "strategia di marketing",
  "development_roadmap": ["fase 1", "fase 2", "fase 3"],
  "userFlow": ["passo 1", "passo 2", "passo 3", "passo 4"]
}

La risposta deve essere in italiano e deve essere un JSON valido. Sii specifico e dettagliato, considerando le peculiarità della categoria.`;

  try {
    const response = await axios.post(process.env.OLLAMA_ENDPOINT, {
      model: process.env.OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    });

    // Estrai il JSON dalla risposta
    const match = response.data.response.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Nessun JSON valido trovato nella risposta');
    }

    const ideaJson = JSON.parse(match[0]);
    
    // Verifica che l'idea non sia troppo simile a quelle esistenti
    const similarityThreshold = 0.7; // Soglia di similarità (70%)
    const isTooSimilar = existingIdeas.some(existingIdea => {
      const similarity = calculateSimilarity(ideaJson.name, existingIdea.title);
      return similarity > similarityThreshold;
    });

    if (isTooSimilar) {
      logger.warn('Idea troppo simile a una esistente, rigenerando...');
      return generateIdeaWithOllama(category, categoryInfo); // Rigenera l'idea
    }

    return { ...ideaTemplate, ...ideaJson };
  } catch (error) {
    logger.error('Errore nella generazione dell\'idea con Ollama:', error);
    throw error;
  }
}

// Funzione per calcolare la similarità tra due stringhe
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Calcolo della distanza di Levenshtein
  const matrix = Array(s2.length + 1).fill().map(() => Array(s1.length + 1).fill(0));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }
  
  // Calcolo della similarità normalizzata (1 - distanza normalizzata)
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (matrix[s2.length][s1.length] / maxLength);
}

async function generateDailyIdeas() {
  try {
    const date = new Date().toISOString().split('T')[0];
    const ideas = [];

    logger.info('🎯 Generazione delle idee giornaliere...\n');

    for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
      logger.info(`\n📝 Generazione idea per ${categoryInfo.name}...`);
      const idea = await generateIdeaWithOllama(categoryKey, categoryInfo);
      
      // Salva l'idea
      const timestamp = Math.floor(Date.now() / 1000);
      const fileName = `${date}_${categoryKey}_${timestamp}.json`;
      const ideaPath = path.join(__dirname, '../logs/ideas', fileName);
      
      fs.writeFileSync(ideaPath, JSON.stringify(idea, null, 2));
      logger.info(`✅ Idea generata e salvata: ${idea.name}`);
      
      ideas.push({
        fileName,
        idea
      });

      // Attendi 2 secondi tra le generazioni
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return ideas;
  } catch (error) {
    logger.error('Errore nella generazione delle idee:', error);
    throw error;
  }
}

// Funzione per stampare l'idea in formato leggibile
function printIdea(idea) {
  console.log('\n🚀 NUOVA IDEA GENERATA');
  console.log('====================');
  console.log(`📱 Nome: ${idea.name}`);
  console.log(`🎯 Categoria: ${idea.category}`);
  console.log(`❓ Problema: ${idea.problem}`);
  console.log(`👥 Target: ${idea.target_audience}`);
  console.log(`💎 Valore Unico: ${idea.unique_value}`);
  
  console.log('\n✨ Funzionalità:');
  idea.features.forEach(f => console.log(`  • ${f}`));
  
  console.log('\n🛠 Tecnologie:');
  console.log(`  • Frontend: ${idea.technologies.frontend}`);
  console.log(`  • Backend: ${idea.technologies.backend}`);
  console.log(`  • Database: ${idea.technologies.database}`);
  console.log('  • Servizi Cloud:');
  idea.technologies.cloud_services.forEach(s => console.log(`    - ${s}`));
  console.log('  • AI/ML:');
  idea.technologies.ai_ml.forEach(t => console.log(`    - ${t}`));
  console.log('  • Altre tecnologie:');
  idea.technologies.other.forEach(t => console.log(`    - ${t}`));
  
  console.log('\n💰 Monetizzazione:', idea.monetization);
  console.log('📢 Marketing:', idea.marketing_strategy);
  
  console.log('\n🗺 Roadmap di Sviluppo:');
  idea.development_roadmap.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  
  console.log('\n👣 Flusso Utente:');
  idea.userFlow.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  
  console.log('\n====================\n');
}

async function runDailyProcess() {
  try {
    logger.info('Avvio processo giornaliero di generazione idee');
    
    // Genera le idee
    const ideas = await generateDailyIdeas();
    logger.info(`Generate ${ideas.length} idee`);

    // Aggiungi prompt ottimizzati per AutoDev
    const ideasWithPrompts = ideas.map(idea => ({
      ...idea,
      autodev_prompt: generateAutoDevPrompt(idea)
    }));

    // Pubblica le idee su GitHub
    await publishUnpublishedIdeas(ideasWithPrompts);
    logger.info('Idee pubblicate con successo su GitHub');

  } catch (error) {
    logger.error('Errore nel processo giornaliero:', error);
    process.exit(1);
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

  ## Architettura Suggerita
  ${idea.suggestedArchitecture}

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
  ${idea.additionalNotes}
  `;
}

// Esporta le funzioni
module.exports = {
  generateDailyIdeas,
  printIdea,
  runDailyProcess,
  generateAutoDevPrompt
};

// Se eseguito direttamente
if (require.main === module) {
  runDailyProcess();
} 