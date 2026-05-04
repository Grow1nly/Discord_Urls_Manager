# Discord URLs Manager

Bot Discord pour trier les messages contenant des URLs, les archiver dans des salons privés et suivre tout ça dans SQLite.

## Fonctionnalités

- Détecte automatiquement les URLs dans les messages
- Classe chaque lien par domaine (YouTube, GitHub, etc.)
- Archive les liens dans des salons privés dédiés
- Évite les doublons avec SQLite
- Reprend le travail après un redémarrage

## Installation

```bash
git clone https://github.com/Grow1nly/Discord_Urls_Manager.git
cd Discord_Urls_Manager
npm install
```

## Configuration

### 1. Créer un fichier `.env`

```env
DISCORD_TOKEN=ton_bot_token
```

### 2. Configurer `config/server.json`

```json
{
  "archiveParentCategoryId": "id_categorie_parent",
  "ownerUserId": "ton_id_user"
}
```

### 3. Configurer `config/categories.json`

```json
{
  "categories": {
    "youtube": {
      "channelName": "archive-youtube",
      "domains": ["youtube.com", "youtu.be"]
    },
    "github": {
      "channelName": "archive-github",
      "domains": ["github.com"]
    }
  },
  "defaultCategoryKey": "default"
}
```

## Permissions Discord requises

- `Guilds`
- `GuildMessages`  
- `Message Content Intent`
- Lire/Envoyer/Supprimer des messages
- Gérer les salons (pour créer les salons d'archive)

## Lancement

```bash
npm start
```

## Commandes

| Commande | Description |
|----------|-------------|
| `npm start` | Démarrer le bot |
| `npm run backfill` | Rescaner tous les messages existants |

## Structure

```
src/
├── index.js           # Point d'entrée
├── services/
│   ├── archiveService.js    # Archivage des liens
│   ├── reconcileService.js # Rescan au démarrage
│   └── linkClassifier.js   # Classification par domaine
└── storage/
    └── sqlite.js      # Base de données
```

## License

MIT