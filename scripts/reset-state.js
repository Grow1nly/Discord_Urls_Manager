const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dbPath = path.join(dataDir, 'archive.sqlite');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`Etat supprime: ${dbPath}`);
  } else {
    console.log(`Aucun etat a supprimer: ${dbPath}`);
  }
} catch (error) {
  if (error && error.code === 'EBUSY') {
    console.error(
      [
        `Impossible de supprimer ${dbPath} car le fichier est verrouille.`,
        'Arrete Discord_Urls_Manager puis relance le reset.',
        'Tu peux aussi utiliser le .bat racine: Discord_Urls_Manager__reset_state.bat'
      ].join('\n')
    );
    process.exit(1);
  }

  throw error;
}
