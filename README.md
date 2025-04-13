# Idea Generator 🤖

Sistema automatico per la generazione e sviluppo di idee innovative per applicazioni software.

## Documentazione 📚

La documentazione completa è disponibile online all'indirizzo: [https://doureallydo.github.io/Idea_Generator](https://doureallydo.github.io/Idea_Generator)

### Contenuti della Documentazione

- **Panoramica**: Introduzione al sistema e alle sue funzionalità
- **Installazione**: Requisiti e configurazione del sistema
- **Utilizzo**: Guide dettagliate per l'utilizzo del sistema
- **Integrazione**: Informazioni sull'integrazione con GitHub e AutoDev
- **Manutenzione**: Gestione dei logs e risoluzione problemi

## Avvio Rapido 🚀

1. Clona il repository:
   ```bash
   git clone https://github.com/dOuReallyDo/Idea_Generator.git
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Configura il token GitHub:
   ```bash
   echo "GITHUB_TOKEN=il_tuo_token_qui" > .env
   ```

4. Avvia il generatore:
   ```bash
   node scripts/dailyGenerator.js
   ```

## Struttura del Progetto 📁

```
Idea_Generator/
├── docs/               # Documentazione
├── scripts/           # Script principali
├── logs/              # File di log
└── .env               # Configurazione
```

## Contribuire 🤝

Le pull request sono benvenute. Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## Licenza 📄

[MIT](https://choosealicense.com/licenses/mit/) 