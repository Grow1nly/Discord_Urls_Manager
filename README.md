# Discord_Urls_Manager

Bot Discord pour trier les messages contenant des URLs, republier les liens dans des salons d'archive prives, puis suivre tout cela dans SQLite.

## Role du service

Le bot fait 4 choses :

1. detecte les URLs dans les messages
2. classe chaque lien selon `config/categories.json`
3. archive le lien dans le salon correspondant
4. garde une trace dans `data/archive.sqlite` pour eviter les doublons et reprendre apres redemarrage

## Architecture

- `src/index.js`
  initialise le service, la connexion Discord et le scan de demarrage
- `src/services/archiveService.js`
  traite les messages et archive les liens
- `src/services/reconcileService.js`
  rescane les salons au demarrage si la config le demande
- `src/services/linkClassifier.js`
  determine la categorie cible pour chaque URL
- `src/storage/sqlite.js`
  gere SQLite dans `data/archive.sqlite`
- `config/server.json` et `config/categories.json`
  portent la configuration simple du service

## Configuration

Dans `.env` :

- `DISCORD_TOKEN`
- `DISCORD_GUILD_ID` optionnel pour limiter le service a un serveur
- `ARCHIVE_OWNER_USER_ID` optionnel pour l'acces aux salons prives

Dans `config/server.json` :

- `archiveParentCategoryId`
- `archiveParentCategoryName`
- `ownerUserId`
- `deleteMode`
- `reconcileOnStartup`
- `reconcileBatchSize`

Dans `config/categories.json` :

- `channelName` pour le nom du salon cible
- `domains` pour les domaines classes dans cette categorie
- `defaultCategoryKey` pour les liens non reconnus

## Installation et lancement

```bash
npm install
npm start
```

## Comportement du bot

- Le bot surveille les nouveaux messages contenant des URLs.
- Chaque lien est classe puis republié dans le bon salon d'archive prive.
- Le service peut supprimer le message source selon `deleteMode`.
- Si `reconcileOnStartup=true`, le bot rescane les messages existants au demarrage.
- Pour un rescan manuel plus large, utilise :

```bash
npm run backfill
```

## Permissions Discord a activer

- `Guilds`
- `GuildMessages`
- `Message Content Intent`

Le bot doit aussi pouvoir :

- lire les messages
- lire l'historique
- envoyer des messages
- supprimer les messages
- gerer les salons s'il doit creer les salons d'archive
