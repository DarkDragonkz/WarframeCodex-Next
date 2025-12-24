const fs = require('fs');
const path = require('path');

// --- CONFIGURAZIONE ---
// Scansiona la cartella corrente (root) per trovare anche la cartella 'public'
const DIR_TO_SCAN = '.'; 
const OUTPUT_FILE = 'TUTTO_IL_CODICE.txt'; 

// Quali estensioni cercare (Codice + Immagini)
const EXTENSIONS = [
    '.js', '.jsx', '.css', '.json', 
    '.svg', '.png', '.jpg', '.jpeg', '.gif'
]; 

// Cartelle da IGNORARE (Lista aggiornata come richiesto)
const IGNORE_DIRS = [
    'node_modules', 
    '.next', 
    'out', 
    '.github', 
    '.git',
    '.vscode', // Utile ignorare anche questa
    'build',
    'dist'
];

// Estensioni considerate "Binarie" (non stampiamo il contenuto, solo il percorso)
const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp'];

function getAllFiles(dirPath, arrayOfFiles) {
  let files;
  try {
    files = fs.readdirSync(dirPath);
  } catch (e) {
    return arrayOfFiles || [];
  }

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Ignora le cartelle proibite
          if (!IGNORE_DIRS.includes(file)) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
          }
        } else {
          // Se l'estensione è tra quelle richieste, aggiungi alla lista
          if (EXTENSIONS.includes(path.extname(file).toLowerCase())) {
            arrayOfFiles.push(fullPath);
          }
        }
    } catch (e) {
        // Ignora file inaccessibili
    }
  });

  return arrayOfFiles;
}

console.log(`Scansione in corso di: ${path.resolve(DIR_TO_SCAN)} ...`);
console.log(`Cartelle ignorate: ${IGNORE_DIRS.join(', ')}`);

const files = getAllFiles(DIR_TO_SCAN);

let outputContent = `DATA DUMP: ${new Date().toISOString()}\n`;
outputContent += `ROOT DIR: ${path.resolve(DIR_TO_SCAN)}\n`;
outputContent += `TOTAL FILES: ${files.length}\n\n`;

files.forEach(file => {
  try {
    const ext = path.extname(file).toLowerCase();

    // 1. Intestazione con il PERCORSO DEL FILE
    outputContent += `\n==================================================\n`;
    outputContent += `FILE: ${file}\n`; 
    outputContent += `==================================================\n`;

    // 2. Gestione Contenuto
    if (BINARY_EXTENSIONS.includes(ext)) {
        // Immagini Binarie: Segnalo solo che esistono e dove sono
        outputContent += `[BINARY IMAGE FILE - PATH LOGGED - CONTENT SKIPPED]\n`;
    } else {
        // Testo (JS, CSS, SVG): Leggo e scrivo il contenuto
        const content = fs.readFileSync(file, 'utf8');
        outputContent += content + `\n`;
    }

  } catch (err) {
    console.error(`Errore leggendo ${file}:`, err.message);
    outputContent += `[ERRORE DI LETTURA FILE]\n`;
  }
});

fs.writeFileSync(OUTPUT_FILE, outputContent);
console.log(`\nFatto! Trovati ${files.length} file.`);
console.log(`Il file "${OUTPUT_FILE}" è stato generato correttamente.`);