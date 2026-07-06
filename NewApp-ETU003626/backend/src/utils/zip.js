import yauzl from 'yauzl';
import { basename } from 'node:path';

/**
 * Extrait un ZIP en mémoire : renvoie une Map { nomFichier -> Buffer }.
 * Ignore les dossiers. Le nom est réduit au basename (ex. "images/1.png" -> "1.png").
 */
export function extractZip(zipPath) {
  return new Promise((resolve, reject) => {
    const files = new Map();
    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err) return reject(err);
      zip.readEntry();
      zip.on('entry', (entry) => {
        // Dossier
        if (/\/$/.test(entry.fileName)) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (streamErr, stream) => {
          if (streamErr) return reject(streamErr);
          const chunks = [];
          stream.on('data', (c) => chunks.push(c));
          stream.on('end', () => {
            files.set(basename(entry.fileName), Buffer.concat(chunks));
            zip.readEntry();
          });
          stream.on('error', reject);
        });
      });
      zip.on('end', () => resolve(files));
      zip.on('error', reject);
    });
  });
}
