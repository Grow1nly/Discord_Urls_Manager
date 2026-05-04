const { getHostname } = require('./linkUtils');

function hostnameMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function createLinkClassifier(config) {
  return {
    classify(url) {
      const hostname = getHostname(url);

      for (const category of config.categories) {
        if (category.domains.some((domain) => hostnameMatches(hostname, domain))) {
          return category;
        }
      }

      return config.categoryMap.get(config.defaultCategoryKey);
    }
  };
}

module.exports = {
  createLinkClassifier
};
