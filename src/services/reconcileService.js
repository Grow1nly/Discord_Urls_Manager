const { ChannelType } = require('discord.js');

function createReconcileService({ config, db, archiveService }) {
  async function reconcileGuild(guild, options = {}) {
    if (!options.force && !config.server.reconcileOnStartup) {
      return;
    }

    const archiveParentId =
      config.server._resolvedArchiveParentCategoryId ||
      config.server.archiveParentCategoryId ||
      null;
    const textChannels = guild.channels.cache.filter(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        channel.viewable &&
        channel.parentId !== archiveParentId
    );

    for (const channel of textChannels.values()) {
      await reconcileChannel(channel, options);
    }
  }

  async function reconcileChannel(channel, options = {}) {
    let before;
    let reachedKnownMessage = false;
    const batchSize = Number(config.server.reconcileBatchSize || 100);
    const state = await db.getScanState(channel.id);
    const checkpointId = state?.last_scanned_message_id || null;
    const reason = options.reason || 'startup_reconcile';

    while (!reachedKnownMessage) {
      const messages = await channel.messages.fetch({
        limit: batchSize,
        before
      });

      if (messages.size === 0) {
        break;
      }

      const ordered = Array.from(messages.values()).sort((a, b) => BigInt(a.id) < BigInt(b.id) ? 1 : -1);

      for (const message of ordered) {
        if (checkpointId && message.id === checkpointId) {
          reachedKnownMessage = true;
          break;
        }

        await archiveService.archiveMessage(message, reason);
      }

      before = messages.last().id;
      await db.updateScanState(channel.id, messages.first().id);
    }
  }

  return {
    reconcileGuild
  };
}

module.exports = {
  createReconcileService
};
