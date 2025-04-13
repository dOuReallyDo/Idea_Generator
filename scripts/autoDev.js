const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const winston = require('winston');
const { Octokit } = require('@octokit/rest');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config();

// Configurazione logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/autodev/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/autodev/combined.log' }),
    new winston.transports.Console({
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

// Configurazione IDE e LLM
const config = {
  preferredIDE: process.env.PREFERRED_IDE || 'cursor', // 'cursor' o 'vscode'
  workspaceRoot: path.join(process.env.HOME, 'AutoDev_Workspace'),
  maxConcurrentProjects: 3,
  developmentTimePerProject: 2 * 60 * 60 * 1000, // 2 ore in millisecondi
  llmConfig: {
    priority: [
      {
        type: 'cloud',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        requiresKey: true,
        keyEnvVar: 'ANTHROPIC_API_KEY'
      },
      {
        type: 'cloud',
        provider: 'openai',
        model: 'gpt-4',
        requiresKey: true,
        keyEnvVar: 'OPENAI_API_KEY'
      },
      {
        type: 'local',
        provider: 'ollama',
        models: ['codellama:34b', 'deepseek-coder:33b', 'mixtral:8x7b'],
        endpoint: 'http://localhost:11434'
      }
    ]
  }
};

class AutoDevAgent {
  constructor() {
    this.activeProjects = new Map();
    this.projectQueue = [];
  }

  async initialize() {
    logger.info('Inizializzazione AutoDev Agent...');
    await this.createWorkspaceIfNeeded();
    await this.setupIDEs();
    await this.configureLLM();
  }

  async createWorkspaceIfNeeded() {
    try {
      await fs.mkdir(config.workspaceRoot, { recursive: true });
      logger.info(`Workspace creato: ${config.workspaceRoot}`);
    } catch (error) {
      logger.error('Errore nella creazione del workspace:', error);
      throw error;
    }
  }

  async setupIDEs() {
    try {
      // Verifica installazione IDE
      if (config.preferredIDE === 'cursor') {
        await execAsync('which cursor');
        logger.info('Cursor è installato e disponibile');
      } else {
        await execAsync('which code');
        logger.info('VSCode è installato e disponibile');
      }
    } catch (error) {
      logger.error(`IDE ${config.preferredIDE} non trovato:`, error);
      throw new Error(`IDE ${config.preferredIDE} non trovato nel sistema`);
    }
  }

  async configureLLM() {
    for (const llm of config.llmConfig.priority) {
      try {
        if (llm.type === 'cloud') {
          const apiKey = process.env[llm.keyEnvVar];
          if (apiKey) {
            logger.info(`LLM cloud configurato: ${llm.provider} - ${llm.model}`);
            this.currentLLM = llm;
            return;
          }
        } else if (llm.type === 'local') {
          // Verifica disponibilità Ollama
          const { stdout } = await execAsync('curl -s http://localhost:11434/api/tags');
          const availableModels = JSON.parse(stdout);
          const model = llm.models.find(m => availableModels.some(am => am.name.includes(m)));
          if (model) {
            logger.info(`LLM locale configurato: ollama - ${model}`);
            this.currentLLM = { ...llm, selectedModel: model };
            return;
          }
        }
      } catch (error) {
        logger.warn(`LLM ${llm.provider || 'locale'} non disponibile:`, error);
      }
    }
    throw new Error('Nessun LLM disponibile');
  }

  async fetchUnstartedProjects() {
    try {
      const { data: issues } = await octokit.issues.listForRepo({
        owner: process.env.GITHUB_USERNAME,
        repo: 'daily-app-ideas',
        state: 'open',
        labels: 'non-sviluppato'
      });

      return issues.map(issue => ({
        id: issue.number,
        title: issue.title,
        body: issue.body,
        url: issue.html_url
      }));
    } catch (error) {
      logger.error('Errore nel recupero dei progetti non sviluppati:', error);
      throw error;
    }
  }

  async startProjectDevelopment(project) {
    try {
      const projectDir = path.join(config.workspaceRoot, `project-${project.id}`);
      await fs.mkdir(projectDir, { recursive: true });

      // Clona il repository template
      const repoName = `app-${project.id}-${Date.now()}`;
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: project.title,
        auto_init: true
      });

      // Clone locale
      await execAsync(`git clone https://github.com/${process.env.GITHUB_USERNAME}/${repoName}.git ${projectDir}`);

      // Avvia IDE
      if (config.preferredIDE === 'cursor') {
        await execAsync(`cursor ${projectDir}`);
      } else {
        await execAsync(`code ${projectDir}`);
      }

      // Aggiorna stato progetto
      this.activeProjects.set(project.id, {
        startTime: Date.now(),
        directory: projectDir,
        repoName: repoName
      });

      // Rimuovi label "non-sviluppato" e aggiungi "in-sviluppo"
      await octokit.issues.removeLabel({
        owner: process.env.GITHUB_USERNAME,
        repo: 'daily-app-ideas',
        issue_number: project.id,
        name: 'non-sviluppato'
      });

      await octokit.issues.addLabels({
        owner: process.env.GITHUB_USERNAME,
        repo: 'daily-app-ideas',
        issue_number: project.id,
        labels: ['in-sviluppo']
      });

      logger.info(`Sviluppo avviato per il progetto ${project.id}`);
    } catch (error) {
      logger.error(`Errore nell'avvio del progetto ${project.id}:`, error);
      throw error;
    }
  }

  async checkProjectProgress() {
    for (const [projectId, project] of this.activeProjects.entries()) {
      const elapsedTime = Date.now() - project.startTime;
      
      if (elapsedTime >= config.developmentTimePerProject) {
        // Commit e push dei cambiamenti
        const { stdout } = await execAsync('git status --porcelain', { cwd: project.directory });
        
        if (stdout) {
          await execAsync('git add .', { cwd: project.directory });
          await execAsync('git commit -m "Sviluppo automatico completato"', { cwd: project.directory });
          await execAsync('git push', { cwd: project.directory });
        }

        // Aggiorna stato su GitHub
        await octokit.issues.removeLabel({
          owner: process.env.GITHUB_USERNAME,
          repo: 'daily-app-ideas',
          issue_number: projectId,
          name: 'in-sviluppo'
        });

        await octokit.issues.addLabels({
          owner: process.env.GITHUB_USERNAME,
          repo: 'daily-app-ideas',
          issue_number: projectId,
          labels: ['sviluppo-completato']
        });

        // Rimuovi da progetti attivi
        this.activeProjects.delete(projectId);
        logger.info(`Sviluppo completato per il progetto ${projectId}`);
      }
    }
  }

  async run() {
    try {
      await this.initialize();

      // Loop principale
      setInterval(async () => {
        try {
          // Controlla progetti attivi
          await this.checkProjectProgress();

          // Se c'è spazio per nuovi progetti
          if (this.activeProjects.size < config.maxConcurrentProjects) {
            const unstartedProjects = await this.fetchUnstartedProjects();
            
            for (const project of unstartedProjects) {
              if (this.activeProjects.size >= config.maxConcurrentProjects) break;
              if (!this.activeProjects.has(project.id)) {
                await this.startProjectDevelopment(project);
              }
            }
          }
        } catch (error) {
          logger.error('Errore nel loop principale:', error);
        }
      }, 5 * 60 * 1000); // Controlla ogni 5 minuti

      logger.info('AutoDev Agent avviato con successo');
    } catch (error) {
      logger.error('Errore fatale in AutoDev Agent:', error);
      process.exit(1);
    }
  }
}

// Avvio dell'agente
const agent = new AutoDevAgent();
agent.run().catch(error => {
  logger.error('Errore nell\'avvio di AutoDev Agent:', error);
  process.exit(1);
}); 