#!/bin/bash

# Percorsi ai progetti
IDEA_GENERATOR_PATH="$HOME/Idea_Generator"
AUTODEV_PATH="$HOME/AutoDev"

# Crea una copia temporanea del crontab attuale
crontab -l > /tmp/current_crontab 2>/dev/null || echo "" > /tmp/current_crontab

# Verifica se i job sono già presenti
IDEA_JOB_EXISTS=$(grep -c "dailyGenerator.js" /tmp/current_crontab)
AUTODEV_JOB_EXISTS=$(grep -c "AutoDev/src/index.js" /tmp/current_crontab)

# Aggiungi i job solo se non esistono già
if [ $IDEA_JOB_EXISTS -eq 0 ]; then
  echo "# Generazione automatica di idee ogni giorno alle 9:00" >> /tmp/current_crontab
  echo "0 9 * * * cd $IDEA_GENERATOR_PATH && /usr/local/bin/node scripts/dailyGenerator.js >> $IDEA_GENERATOR_PATH/logs/cron.log 2>&1" >> /tmp/current_crontab
  echo "Job per Idea Generator aggiunto al crontab."
else
  echo "Job per Idea Generator già presente nel crontab."
fi

if [ $AUTODEV_JOB_EXISTS -eq 0 ]; then
  echo "# Esecuzione AutoDev ogni giorno alle 10:00" >> /tmp/current_crontab
  echo "0 10 * * * cd $AUTODEV_PATH && /usr/local/bin/node src/index.js >> $AUTODEV_PATH/logs/cron.log 2>&1" >> /tmp/current_crontab
  echo "Job per AutoDev aggiunto al crontab."
else
  echo "Job per AutoDev già presente nel crontab."
fi

# Installa il nuovo crontab
crontab /tmp/current_crontab
rm /tmp/current_crontab

echo "Configurazione completata. I seguenti job sono stati configurati:"
echo "1. Idea Generator: Esecuzione ogni giorno alle 9:00"
echo "2. AutoDev: Esecuzione ogni giorno alle 10:00"
echo
echo "I log saranno salvati in:"
echo "- $IDEA_GENERATOR_PATH/logs/cron.log"
echo "- $AUTODEV_PATH/logs/cron.log" 