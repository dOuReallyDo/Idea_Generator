const { generateDailyIdeas } = require('./generateIdea');
const { publishUnpublishedIdeas } = require('./publishToGithub');
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
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

async function runDailyProcess() {
  try {
    logger.info('🎯 Avvio processo giornaliero di generazione e pubblicazione idee...');

    // Genera le idee per ogni categoria
    logger.info('📝 Generazione delle idee...');
    const ideas = await generateDailyIdeas();
    logger.info(`✅ Generate ${ideas.length} idee con successo!`);

    // Pubblica le idee su GitHub
    logger.info('🚀 Pubblicazione delle idee su GitHub...');
    await publishUnpublishedIdeas();
    logger.info('✅ Pubblicazione completata!');

    logger.info('🎉 Processo giornaliero completato con successo!');
  } catch (error) {
    logger.error('❌ Errore durante il processo giornaliero:', error);
    process.exit(1);
  }
}

// Se eseguito direttamente
if (require.main === module) {
  runDailyProcess();
} 