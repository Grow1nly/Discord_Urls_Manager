require('dotenv').config();

const path = require('node:path');
const { Client, GatewayIntentBits } = require('discord.js');
const { loadConfig } = require('../src/config/loadConfig');
const { initializeDatabase } = require('../src/storage/sqlite');
const { createLinkClassifier } = require('../src/services/linkClassifier');
const { createArchiveService } = require('../src/services/archiveService');
const { createReconcileService } = require('../src/services/reconcileService');

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
    console.log(`Backfill connecte en tant que ${client.user.tag}`);

    const guilds = guildId
      ? [await client.guilds.fetch(guildId)]
      : Array.from(client.guilds.cache.values());

    for (const partialGuild of guilds) {
      const guild = partialGuild.available ? partialGuild : await client.guilds.fetch(partialGuild.id);
      await guild.channels.fetch();
      await guild.members.fetchMe();
      console.log(`Backfill du serveur ${guild.name}...`);
      await reconcileService.reconcileGuild(guild, {
        force: true,
        reason: 'manual_backfill'
      });
    }

    console.log('Backfill termine.');
    await client.destroy();
  });

  await client.login(token);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
