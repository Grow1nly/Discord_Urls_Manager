const URL_REGEX = /\bhttps?:\/\/[^\s<>()]+/gi;

function extractUrls(content) {
  if (!content) {
    return [];
  }

  return Array.from(new Set(content.match(URL_REGEX) || []));
}

function removeTrackingParams(searchParams) {
  const keysToDelete = [];

  for (const key of searchParams.keys()) {
    if (
      key.startsWith('utm_') ||
      key === 'fbclid' ||
      key === 'gclid' ||
      key === 'si' ||
      key === 'ref'
    ) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => searchParams.delete(key));
}

function normalizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = '';
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    removeTrackingParams(parsed.searchParams);

    const params = Array.from(parsed.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    parsed.search = '';
    for (const [key, value] of params) {
      parsed.searchParams.append(key, value);
    }

    let normalized = parsed.toString();
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  } catch (error) {
    return String(rawUrl || '').trim().toLowerCase();
  }
}

function getHostname(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch (error) {
    return '';
  }
}

function isMostlyLinkMessage(content, urls) {
  const text = String(content || '').trim();
  if (!text) {
    return false;
  }

  const textWithoutUrls = urls.reduce((acc, url) => acc.split(url).join(' '), text).replace(/\s+/g, ' ').trim();
  if (!textWithoutUrls) {
    return true;
  }

  return textWithoutUrls.length <= 20;
}

module.exports = {
  extractUrls,
  normalizeUrl,
  getHostname,
  isMostlyLinkMessage
};
