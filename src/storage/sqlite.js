const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

function openDatabase(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return new sqlite3.Database(filePath);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        changes: this.changes,
        lastID: this.lastID
      });
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row || null);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

async function initializeDatabase(filePath) {
  const db = openDatabase(filePath);

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS archived_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      source_channel_id TEXT NOT NULL,
      source_message_id TEXT NOT NULL,
      source_author_id TEXT,
      original_url TEXT NOT NULL,
      normalized_url TEXT NOT NULL UNIQUE,
      category_key TEXT NOT NULL,
      target_channel_id TEXT NOT NULL,
      archive_message_id TEXT,
      processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS processed_messages (
      message_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      action TEXT NOT NULL,
      processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS scan_state (
      channel_id TEXT PRIMARY KEY,
      last_scanned_message_id TEXT,
      scanned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  return {
    db,
    run: (sql, params) => run(db, sql, params),
    get: (sql, params) => get(db, sql, params),
    all: (sql, params) => all(db, sql, params),
    async hasArchivedUrl(normalizedUrl) {
      const row = await get(db, 'SELECT id FROM archived_links WHERE normalized_url = ?', [normalizedUrl]);
      return Boolean(row);
    },
    async getArchivedLink(normalizedUrl) {
      return get(
        db,
        `SELECT
          guild_id,
          source_channel_id,
          source_message_id,
          original_url,
          normalized_url,
          category_key,
          target_channel_id,
          archive_message_id,
          processed_at
        FROM archived_links
        WHERE normalized_url = ?`,
        [normalizedUrl]
      );
    },
    async deleteArchivedLink(normalizedUrl) {
      await run(db, 'DELETE FROM archived_links WHERE normalized_url = ?', [normalizedUrl]);
    },
    async recordArchivedLink(record) {
      await run(
        db,
        `INSERT OR IGNORE INTO archived_links (
          guild_id,
          source_channel_id,
          source_message_id,
          source_author_id,
          original_url,
          normalized_url,
          category_key,
          target_channel_id,
          archive_message_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.guildId,
          record.sourceChannelId,
          record.sourceMessageId,
          record.sourceAuthorId,
          record.originalUrl,
          record.normalizedUrl,
          record.categoryKey,
          record.targetChannelId,
          record.archiveMessageId
        ]
      );
    },
    async hasProcessedMessage(messageId) {
      const row = await get(db, 'SELECT message_id FROM processed_messages WHERE message_id = ?', [messageId]);
      return Boolean(row);
    },
    async recordProcessedMessage(messageId, guildId, channelId, action) {
      await run(
        db,
        `INSERT OR REPLACE INTO processed_messages (
          message_id,
          guild_id,
          channel_id,
          action,
          processed_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [messageId, guildId, channelId, action]
      );
    },
    async updateScanState(channelId, messageId) {
      await run(
        db,
        `INSERT OR REPLACE INTO scan_state (
          channel_id,
          last_scanned_message_id,
          scanned_at
        ) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [channelId, messageId]
      );
    },
    async getScanState(channelId) {
      return get(db, 'SELECT last_scanned_message_id FROM scan_state WHERE channel_id = ?', [channelId]);
    }
  };
}

module.exports = {
  initializeDatabase
};
