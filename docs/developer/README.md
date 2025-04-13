# Idea Generator - Documentazione Tecnica

## Indice
1. [Architettura](#architettura)
2. [Configurazione](#configurazione)
3. [API](#api)
4. [Integrazione con AutoDev](#integrazione-con-autodev)
5. [Workflow di Sviluppo](#workflow-di-sviluppo)
6. [Testing](#testing)
7. [Deployment](#deployment)

## Architettura

### Componenti Principali
- **Idea Generator**: Genera idee di progetto basate su template predefiniti
- **AutoDev Integration**: Gestisce l'integrazione con AutoDev per lo sviluppo automatico
- **GitHub Sync**: Sincronizza idee e progetti con GitHub

### Struttura del Progetto
```
/
├── src/                    # Codice sorgente principale
│   ├── generateIdea.js     # Generatore di idee
│   └── publishToGithub.js  # Gestione GitHub
├── scripts/                # Script di utilità
├── templates/              # Template per la generazione
├── tests/                  # Test unitari e integrazione
└── docs/                   # Documentazione
```

## Configurazione

### Requisiti
- Node.js >= 16
- npm >= 8
- GitHub API Token
- AutoDev API Token

### Variabili d'Ambiente
```env
GITHUB_TOKEN=your_github_token
AUTODEV_TOKEN=your_autodev_token
TEMPLATE_PATH=./templates/idea_template.json
```

## API

### generateDailyIdeas()
```javascript
const { generateDailyIdeas } = require('./src/generateIdea');

// Genera 3 idee giornaliere
const ideas = await generateDailyIdeas(3);
```

### publishToGithub()
```javascript
const { publishToGithub } = require('./src/publishToGithub');

// Pubblica le idee su GitHub
await publishToGithub(ideas);
```

## Integrazione con AutoDev

### Flusso di Lavoro
1. Generazione idee
2. Validazione e test
3. Creazione repository GitHub
4. Invio ad AutoDev
5. Monitoraggio sviluppo

### Formato del Prompt
```markdown
# Prompt per AutoDev
## Contesto
[Descrizione progetto]

## Obiettivi
[Lista obiettivi]

## Requisiti Tecnici
[Stack tecnologico]

## Timeline
[Fasi di sviluppo]
```

## Workflow di Sviluppo

### Branch Strategy
- `main`: Branch principale
- `develop`: Sviluppo in corso
- `feature/*`: Nuove funzionalità
- `bugfix/*`: Correzione bug

### Commit Convention
- `feat`: Nuove funzionalità
- `fix`: Correzione bug
- `docs`: Documentazione
- `test`: Test
- `chore`: Manutenzione

## Testing

### Test Unitari
```bash
npm test
```

### Test di Integrazione
```bash
npm run test:integration
```

## Deployment

### Pipeline CI/CD
1. Test automatici
2. Build
3. Deployment su GitHub
4. Sincronizzazione con AutoDev

### Monitoraggio
- Logs in `logs/`
- Metriche di performance
- Stato repository GitHub
- Progresso AutoDev 