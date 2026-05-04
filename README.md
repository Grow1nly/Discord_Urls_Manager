# Discord URLs Manager

[![GitHub](https://img.shields.io/badge/github-Grow1nly-blue.svg)](https://github.com/Grow1nly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)

> Bot Discord pour trier les messages contenant des URLs, les archiver dans des salons privés et suivre tout cela dans SQLite.

## ✨ Fonctionnalités

- 🔍 **Détection automatique** - Détecte les URLs dans les nouveaux messages
- 🗂️ **Classification intelligente** - Classe chaque lien selon `config/categories.json`
- 📁 **Archivage structuré** - Republie les liens dans les salons d'archive privés correspondants
- 💾 **Suivi SQLite** - Garde une trace dans `data/archive.sqlite` pour éviter les doublons
- 🔄 **Reprise au redémarrage** - Reprend le travail après un redémarrage du bot
- 🧹 **Mode suppression** - Peut supprimer le message source après archivage
- 🔁 **Rescan manuel** - Permet un rescan manuel des messages existants

## 🎯 Cas d'utilisation

Ce bot est conçu pour les serveurs Discord qui souhaitent :
- Archiver automatiquement les liens partagés dans des salons organisés
- Catégoriser les URLs par domaine (YouTube, GitHub, etc.)
- Garder un historique consultable via SQLite
- Éviter les doublons dans les archives

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- [Discord.js](https://discord.js.org/) v14
- Un token de bot Discord avec les permissions appropriées
- Accès admin au serveur Discord cible

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Grow1nly/Discord_Urls_Manager.git
cd Discord_Urls_Manager
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Créer un fichier `.env` à la racine du projet :

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=1234567890123456789
ARCHIVE_OWNER_USER_ID=1234567890123456789
```

**⚠️ Attention sécurité** : Ne jamais commit votre `.env` avec de vrais tokens ! Le fichier est ignoré par git via `.gitignore`.

### 4. Configurer les catégories

Modifier `config/categories.json` pour définir vos catégories :

```json
{
  "categories": {
    "youtube": {
      "channelName": "archive-youtube",
      "domains": ["youtube.com", "youtu.be"]
    },
    "github": {
      "channelName": "archive-github", 
      "domains": ["github.com", "gist.github.com"]
    },
    "default": {
      "channelName": "archive-autres",
      "domains": []
    }
  },
  "defaultCategoryKey": "default"
}
```

### 5. Lancer le bot

```bash
npm start
```

## 📖 Utilisation

### Comportement du bot

1. Le bot surveille les nouveaux messages contenant des URLs
2. Chaque lien est classé selon les domaines définis dans `categories.json`
3. Le lien est republicié dans le salon d'archive privé correspondant
4. Une trace est enregistrée dans SQLite pour éviter les doublons

### Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre le bot en mode production |
| `npm run backfill` | Lance un rescan manuel des messages existants |
| `npm run reset-state` | Réinitialise l'état de la base de données |

### Permissions Discord requises

Le bot a besoin des intents et permissions suivants :

- ✅ `Guilds`
- ✅ `GuildMessages`
- ✅ `Message Content Intent`
- ✅ Lire les messages
- ✅ Lire l'historique des messages
- ✅ Envoyer des messages
- ✅ Supprimer des messages
- ✅ Gérer les salons (si création automatique)

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Requis | Exemple |
|----------|-------------|--------|---------|
| `DISCORD_TOKEN` | Token du bot Discord | Oui | `MTExMjIy...` |
| `DISCORD_GUILD_ID` | ID du serveur Discord | Non | `1234567890123456789` |
| `ARCHIVE_OWNER_USER_ID` | ID utilisateur pour salons privés | Non | `1234567890123456789` |

### Fichiers de configuration

#### `config/server.json`

```json
{
  "archiveParentCategoryId": "1234567890123456789",
  "archiveParentCategoryName": "Archives",
  "ownerUserId": "1234567890123456789",
  "deleteMode": false,
  "reconcileOnStartup": false,
  "reconcileBatchSize": 100
}
```

| Option | Description | Défaut |
|--------|-------------|--------|
| `archiveParentCategoryId` | ID de la catégorie parente des salons d'archive | - |
| `archiveParentCategoryName` | Nom de la catégorie d'archive | "Archives" |
| `ownerUserId` | ID du propriétaire des salons privés | - |
| `deleteMode` | Supprime le message source après archivage | `false` |
| `reconcileOnStartup` | Rescane les salons au démarrage | `false` |
| `reconcileBatchSize` | Taille du batch pour le rescan | `100` |

#### `config/categories.json`

| Option | Description |
|--------|-------------|
| `channelName` | Nom du salon cible pour cette catégorie |
| `domains` | Liste des domaines associés à cette catégorie |
| `defaultCategoryKey` | Clé de la catégorie par défaut pour les liens non reconnus |

## 🔒 Sécurité

### Notes de sécurité importantes

- ✅ Le fichier `.env` n'est **jamais commité** (voir `.gitignore`)
- ✅ Tous les tokens et secrets sont chargés depuis les variables d'environnement
- ✅ Pas de credentials hardcodés dans le code source
- ✅ Base de données SQLite locale (pas de données externes)
- ✅ Surface d'attaque minimale avec uniquement les dépendances nécessaires

### Bonnes pratiques

1. **Ne jamais partager votre `.env`** - Stockez-le de manière sécurisée localement
2. **Utiliser des tokens séparés** - Ne pas réutiliser les tokens entre projets
3. **Mettre à jour régulièrement les dépendances** - `npm audit fix`
4. **Limiter les permissions du bot** - Accorder uniquement les permissions nécessaires
5. **Garder .gitignore à jour** - S'assurer que les fichiers sensibles sont exclus

## 📂 Structure du projet

```
Discord_Urls_Manager/
├── src/
│   ├── index.js              # Point d'entrée, initialisation Discord
│   ├── config/
│   │   └── loadConfig.js     # Chargement de la configuration
│   ├── services/
│   │   ├── archiveService.js # Traitement des messages et archivage
│   │   ├── reconcileService.js # Rescan des salons au démarrage
│   │   ├── linkClassifier.js # Classification des URLs par domaine
│   │   └── linkUtils.js      # Utilitaires pour les liens
│   └── storage/
│       └── sqlite.js         # Gestion de la base SQLite
├── config/
│   ├── server.json           # Configuration du serveur
│   └── categories.json      # Définition des catégories d'archives
├── data/
│   └── archive.sqlite        # Base de données SQLite (git ignorée)
├── scripts/
│   ├── backfill.js           # Script de rescan manuel
│   └── reset-state.js       # Script de réinitialisation
├── .env.example              # Template de configuration
├── .gitignore                # Règles git pour fichiers sensibles
├── package.json              # Dépendances et scripts
└── README.md                # Cette documentation
```

### Description des fichiers

| Fichier | Purpose |
|---------|---------|
| `src/index.js` | Initialise le client Discord et lance le scan au démarrage |
| `src/config/loadConfig.js` | Charge et valide la configuration depuis les fichiers JSON |
| `src/services/archiveService.js` | Traite les messages, archive les liens dans les salons privés |
| `src/services/reconcileService.js` | Rescane les salons existants au démarrage si configuré |
| `src/services/linkClassifier.js` | Détermine la catégorie cible pour chaque URL |
| `src/services/linkUtils.js` | Utilitaires pour parser et valider les URLs |
| `src/storage/sqlite.js` | Gère la base SQLite pour le suivi des liens archivés |

## 🛠️ Développement

### Scripts disponibles

```bash
npm start           # Démarre le bot en production
npm run backfill    # Lance un rescan manuel des messages
npm run reset-state # Réinitialise la base de données
```

### Base de données

La base SQLite `data/archive.sqlite` contient :

```sql
-- Table des liens archivés
CREATE TABLE IF NOT EXISTS archived_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    source_message_id TEXT,
    source_channel_id TEXT,
    archive_channel_id TEXT,
    category_key TEXT,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour éviter les doublons
CREATE UNIQUE INDEX idx_url ON archived_links(url);
```

## 🐛 Dépannage

### Problèmes courants

#### Le bot ne se connecte pas à Discord

- Vérifier que `DISCORD_TOKEN` est correct
- S'assurer que le bot a été invité au serveur
- Vérifier que le bot a les intents activés sur le portal développeur Discord

#### Les salons d'archive ne sont pas créés

- Vérifier que `archiveParentCategoryId` est correct
- S'assurer que le bot a la permission "Gérer les salons"
- Vérifier que `ownerUserId` est l'ID correct du propriétaire

#### Les liens ne sont pas archivés

- Vérifier que le bot a la permission "Lire les messages"
- S'assurer que l'intent "Message Content" est activé
- Vérifier que les domaines dans `categories.json` sont corrects

#### Doublons dans les archives

- Vérifier que la base SQLite n'est pas corrompue
- Exécuter `npm run reset-state` pour nettoyer
- Vérifier les permissions SQLite

### Mode debug

Activer les logs détaillés en ajoutant dans `.env` :

```env
DEBUG=true
```

## 🔧 Architecture

### Flux de fonctionnement

```
┌─────────────────┐
│   .env          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   loadConfig.js│
│   (load config)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  linkClassifier│
│  (categorize)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   archiveService.js            │
│   ┌───────────────────────────┐ │
│   │  Discord API              │ │
│   │  - créer salon si absent  │ │
│   │  - envoyer message        │ │
│   └───────────────────────────┘ │
│                                 │
│   ┌───────────────────────────┐ │
│   │  sqlite.js                │ │
│   │  - vérifier doublon       │ │
│   │  - inserer lien            │ │
│   └───────────────────────────┘ │
└─────────────────────────────────┘
```

### Composants clés

1. **Discord Client** - Gère la connexion bot et l'écoute des messages
2. **Link Classifier** - Analyse les URLs et détermine la catégorie cible
3. **Archive Service** - Gère la création des salons et l'archivage
4. **SQLite Storage** - Persiste les liens pour éviter les doublons
5. **Reconcile Service** - Gère le rescan des salons existants

## 📜 License

MIT License

Copyright (c) 2026 Grow1nly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 📞 Support

Pour les problèmes ou questions :
- Créer une [Issue](https://github.com/Grow1nly/Discord_Urls_Manager/issues) sur GitHub
- Consulter les issues existantes pour des problèmes similaires

## 🙏 Remerciements

- [Discord.js](https://discord.js.org/) - Bibliothèque Node.js pour Discord
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite pour Node.js
- Contributeurs open source

---

**Auteur**: [Grow1nly](https://github.com/Grow1nly)  
**Créé**: Mai 2026  
**Dernière mise à jour**: 4 Mai 2026