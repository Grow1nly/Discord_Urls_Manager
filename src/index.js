require('dotenv').config();

const path = require('node:path');
const { Client, GatewayIntentBits } = require('discord.js');
const { loadConfig } = require('./config/loadConfig');
const { initializeDatabase } = require('./storage/sqlite');
const { createLinkClassifier } = require('./services/linkClassifier');
const { createArchiveService } = require('./services/archiveService');
const { createReconcileService } = require('./services/reconcileService');

async function main() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error('DISCORD_TOKEN manquant dans .env');
  }

  const config = loadConfig();
  const guildId = process.env.DISCORD_GUILD_ID || null;
  config.server.ownerUserId = process.env.ARCHIVE_OWNER_USER_ID || config.server.ownerUserId || '';

  const db = await initializeDatabase(path.join(config.dataDir, 'archive.sqlite'));
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  const classifier = createLinkClassifier(config);
  const archiveService = createArchiveService({
    config,
    db,
    classifier
  });
  const reconcileService = createReconcileService({
    config,
    db,
    archiveService
  });

  client.once('clientReady', async () => {
    console.log(`[Discord_Urls_Manager] Service connecte: ${client.user.tag}`);

    const guilds = guildId
      ? [await client.guilds.fetch(guildId)]
      : Array.from(client.guilds.cache.values());

    for (const partialGuild of guilds) {
      const guild = partialGuild.available ? partialGuild : await client.guilds.fetch(partialGuild.id);
      await guild.channels.fetch();
      await guild.members.fetchMe();
      await reconcileService.reconcileGuild(guild);
    }

    console.log(
      `[Discord_Urls_Manager] Service actif. Surveillance en direct et reconciliation terminee sur ${guilds.length} serveur(s).`
    );
  });

  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild || message.author.bot) {
        return;
      }

      if (guildId && message.guild.id !== guildId) {
        return;
      }

      await archiveService.archiveMessage(message, 'live_message');
    } catch (error) {
      console.error('[Discord_Urls_Manager] Erreur pendant le traitement d\'un message:', error);
    }
  });

  await client.login(token);
}

main().catch((error) => {
  console.error('[Discord_Urls_Manager] Erreur fatale au demarrage du service:', error);
  process.exitCode = 1;
});
