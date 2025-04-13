const { generateDailyIdeas } = require('../src/generateIdea');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

describe('Test IdeaGenerator', () => {
    const testDataDir = path.join(__dirname, '..', 'test_data');
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({ filename: 'test.log', level: 'error' }),
            new winston.transports.Console()
        ]
    });

    beforeAll(async () => {
        try {
            // Crea directory per i dati di test
            await fs.mkdir(testDataDir, { recursive: true });
            
            // Verifica esistenza template
            const templatePath = path.join(__dirname, '..', 'templates', 'idea_template.json');
            if (!await fs.access(templatePath).then(() => true).catch(() => false)) {
                throw new Error('Template non trovato');
            }
        } catch (error) {
            logger.error('Errore durante il setup dei test:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            await fs.rm(testDataDir, { recursive: true, force: true });
        } catch (error) {
            logger.error('Errore durante la pulizia dei dati di test:', error);
        }
    });

    test('Generazione idee giornaliere', async () => {
        try {
            const ideas = await generateDailyIdeas();
            
            expect(ideas).toBeDefined();
            expect(Array.isArray(ideas)).toBe(true);
            expect(ideas.length).toBeGreaterThan(0);

            // Verifica struttura delle idee
            ideas.forEach(idea => {
                expect(idea).toHaveProperty('id');
                expect(idea).toHaveProperty('title');
                expect(idea).toHaveProperty('description');
                expect(idea).toHaveProperty('mainObjective');
                expect(idea).toHaveProperty('keyFeatures');
                expect(idea).toHaveProperty('technicalRequirements');
                expect(idea).toHaveProperty('timeline');
                expect(idea).toHaveProperty('resources');
                expect(idea).toHaveProperty('autodev_prompt');
            });

            // Salva le idee per il test
            await fs.writeFile(
                path.join(testDataDir, 'generated_ideas.json'),
                JSON.stringify(ideas, null, 2)
            );

            logger.info('Test generazione idee completato con successo');
        } catch (error) {
            logger.error('Errore nel test di generazione idee:', error);
            throw error;
        }
    });

    test('Validazione prompt AutoDev', async () => {
        try {
            const ideas = await generateDailyIdeas();
            
            ideas.forEach(idea => {
                const prompt = idea.autodev_prompt;
                expect(prompt).toContain(idea.title);
                expect(prompt).toContain(idea.description);
                expect(prompt).toContain('## Obiettivi Principali');
                expect(prompt).toContain('## Requisiti Tecnici');
                expect(prompt).toContain('## Timeline Stimata');
                expect(prompt).toContain('## Risorse Necessarie');
            });

            logger.info('Test validazione prompt completato con successo');
        } catch (error) {
            logger.error('Errore nel test di validazione prompt:', error);
            throw error;
        }
    });
}); 