const { ChannelType, OverwriteType, PermissionFlagsBits } = require('discord.js');

async function ensureArchiveParentCategory(guild, serverConfig) {
  if (serverConfig.archiveParentCategoryId) {
    const existing = await guild.channels.fetch(serverConfig.archiveParentCategoryId).catch(() => null);
    if (existing && existing.type === ChannelType.GuildCategory) {
      serverConfig._resolvedArchiveParentCategoryId = existing.id;
      return existing;
    }
  }

  const byName = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === serverConfig.archiveParentCategoryName
  );

  if (byName) {
    serverConfig._resolvedArchiveParentCategoryId = byName.id;
    return byName;
  }

  const created = await guild.channels.create({
    name: serverConfig.archiveParentCategoryName,
    type: ChannelType.GuildCategory
  });
  serverConfig._resolvedArchiveParentCategoryId = created.id;
  return created;
}

async function ensureArchiveChannel(guild, categoryDefinition, serverConfig) {
  const parent = await ensureArchiveParentCategory(guild, serverConfig);

  const existing = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.parentId === parent.id &&
      channel.name === categoryDefinition.channelName
  );

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory
      ],
      deny: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.CreatePrivateThreads,
        PermissionFlagsBits.ManageMessages
      ]
    },
    {
      id: guild.members.me.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  if (serverConfig.ownerUserId) {
    permissionOverwrites.push({
      id: serverConfig.ownerUserId,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  if (existing) {
    await existing.setParent(parent.id, { lockPermissions: false });
    await existing.permissionOverwrites.set(permissionOverwrites);
    return existing;
  }

  return guild.channels.create({
    name: categoryDefinition.channelName,
    type: ChannelType.GuildText,
    parent: parent.id,
    permissionOverwrites
  });
}

module.exports = {
  ensureArchiveParentCategory,
  ensureArchiveChannel
};
