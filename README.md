# Generatore di Idee per Applicazioni

Questo progetto genera automaticamente idee per applicazioni e crea template di progetti pronti all'uso.

## 🎯 Obiettivo

Ogni giorno alle 09:00, il sistema:
1. Genera una nuova idea per un'applicazione
2. Crea un template di progetto completo
3. Pubblica il template su GitHub
4. Registra le operazioni in un log locale

## 🚀 Funzionalità

- Generazione automatica di idee per applicazioni
- Creazione di template con struttura frontend/backend
- Verifica automatica del codice
- Logging delle operazioni
- Integrazione con GitHub

## 🛠 Tecnologie

- Node.js
- Next.js (Frontend)
- Express.js (Backend)
- GitHub API
- Jest (Testing)

## 📝 Struttura del Progetto

```
.
├── frontend/          # Applicazione Next.js
├── backend/           # Server Express.js
├── scripts/          # Script di automazione
├── logs/             # File di log
└── docs/             # Documentazione
```

## 🏁 Come Iniziare

1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Configura le variabili d'ambiente:
   ```bash
   cp .env.example .env
   ```
4. Avvia l'applicazione:
   ```bash
   npm run dev
   ```

## 📄 Licenza

MIT 