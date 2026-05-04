const { ensureArchiveChannel } = require('./channelProvisioner');
const { extractUrls, isMostlyLinkMessage, normalizeUrl } = require('./linkUtils');

function createArchiveService({ config, db, classifier }) {
  async function isArchivedRecordStillValid(guild, record) {
    const channel = await guild.channels.fetch(record.target_channel_id).catch(() => null);
    if (!channel?.isTextBased()) {
      return false;
    }

    if (!record.archive_message_id) {
      return true;
    }

    const archiveMessage = await channel.messages.fetch(record.archive_message_id).catch(() => null);
    return Boolean(archiveMessage);
  }

  async function sendDuplicateNotice(message, duplicateRecords) {
    if (duplicateRecords.length === 0) {
      return;
    }

    const seen = new Set();
    const locations = [];

    for (const record of duplicateRecords) {
      const key = `${record.target_channel_id}:${record.archive_message_id || ''}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      if (record.archive_message_id) {
        locations.push(
          `- <#${record.target_channel_id}> : https://discord.com/channels/${message.guild.id}/${record.target_channel_id}/${record.archive_message_id}`
        );
      } else {
        locations.push(`- <#${record.target_channel_id}>`);
      }
    }

    const notice = await message.channel.send({
      content: [
        `<@${message.author.id}> lien deja archive.`,
        'Tu peux le retrouver ici :',
        ...locations.slice(0, 5)
      ].join('\n')
    });

    setTimeout(() => {
      notice.delete().catch(() => null);
    }, 20000);
  }

  async function archiveMessage(message, reason) {
    if (!message.guild || message.author.bot) {
      return;
    }

    if (await db.hasProcessedMessage(message.id)) {
      return;
    }

    const urls = extractUrls(message.content);
    if (urls.length === 0) {
      return;
    }

    const archivedNormalizedUrls = [];
    const duplicateRecords = [];

    for (const url of urls) {
      const normalizedUrl = normalizeUrl(url);
      const existingRecord = await db.getArchivedLink(normalizedUrl);
      if (existingRecord) {
        const isStillValid = await isArchivedRecordStillValid(message.guild, existingRecord);
        if (isStillValid) {
          duplicateRecords.push(existingRecord);
          continue;
        }

        await db.deleteArchivedLink(normalizedUrl);
      }

      const category = classifier.classify(url);
      const targetChannel = await ensureArchiveChannel(message.guild, category, config.server);
      const archiveMessage = await targetChannel.send({
        content: [
          `source: <#${message.channelId}>`,
          `author: <@${message.author.id}>`,
          `reason: ${reason}`,
          `url: ${url}`
        ].join('\n')
      });

      await db.recordArchivedLink({
        guildId: message.guild.id,
        sourceChannelId: message.channelId,
        sourceMessageId: message.id,
        sourceAuthorId: message.author.id,
        originalUrl: url,
        normalizedUrl,
        categoryKey: category.key,
        targetChannelId: targetChannel.id,
        archiveMessageId: archiveMessage.id
      });

      archivedNormalizedUrls.push(normalizedUrl);
    }

    if (archivedNormalizedUrls.length === 0) {
      const duplicateShouldDelete = message.deletable && isMostlyLinkMessage(message.content, urls);
      if (duplicateShouldDelete) {
        await message.delete().catch(() => null);
      }

      await sendDuplicateNotice(message, duplicateRecords);
      await db.recordProcessedMessage(
        message.id,
        message.guild.id,
        message.channelId,
        duplicateShouldDelete ? 'duplicate_deleted' : 'duplicate_kept'
      );
      return;
    }

    const deleteMode = config.server.deleteMode;
    const shouldDeleteForArchive =
      deleteMode === 'always' ||
      (deleteMode === 'mostly_links' && isMostlyLinkMessage(message.content, urls));
    const shouldDeleteForDuplicate = duplicateRecords.length > 0 && isMostlyLinkMessage(message.content, urls);
    const shouldDelete = shouldDeleteForArchive || shouldDeleteForDuplicate;

    if (duplicateRecords.length > 0) {
      await sendDuplicateNotice(message, duplicateRecords);
    }

    if (shouldDelete && message.deletable) {
      await message.delete().catch(() => null);
      await db.recordProcessedMessage(
        message.id,
        message.guild.id,
        message.channelId,
        duplicateRecords.length > 0 ? 'archived_with_duplicate_deleted' : 'archived_deleted'
      );
      return;
    }

    await db.recordProcessedMessage(
      message.id,
      message.guild.id,
      message.channelId,
      duplicateRecords.length > 0 ? 'archived_with_duplicate_kept' : 'archived_kept'
    );
  }

  return {
    archiveMessage
  };
}

module.exports = {
  createArchiveService
};
