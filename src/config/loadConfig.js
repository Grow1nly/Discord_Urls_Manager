const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');

function readJsonFile(fileName) {
  const filePath = path.join(CONFIG_DIR, fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

function loadConfig() {
  const server = readJsonFile('server.json');
  const categoriesDocument = readJsonFile('categories.json');
  const categories = categoriesDocument.categories.map((category) => ({
    ...category,
    domains: Array.from(new Set((category.domains || []).map(normalizeDomain).filter(Boolean)))
  }));

  const categoryMap = new Map(categories.map((category) => [category.key, category]));

  if (!categoryMap.has(categoriesDocument.defaultCategoryKey)) {
    throw new Error(
      `La categorie par defaut "${categoriesDocument.defaultCategoryKey}" n'existe pas dans config/categories.json`
    );
  }

  return {
    rootDir: ROOT_DIR,
    dataDir: path.join(ROOT_DIR, 'data'),
    server,
    categories,
    categoryMap,
    defaultCategoryKey: categoriesDocument.defaultCategoryKey
  };
}

module.exports = {
  loadConfig,
  normalizeDomain
};
