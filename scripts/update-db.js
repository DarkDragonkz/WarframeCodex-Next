const fs = require('fs');
const path = require('path');
const https = require('https');

// URL DIRETTO ai file JSON grezzi sul branch MASTER
const BASE_URL = "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json";

const categories = [
    'Warframes','All', 'Primary', 'Secondary', 'Melee', 'Archwing', 
    'Arch-Gun', 'Arch-Melee', 'Sentinels', 'Pets', 'Mods', 
    'Relics', 'Skins', 'Gear', 'Resources', 'Fish', 
    'Glyphs', 'Sigils', 'Enemy', 'Misc', 'Quest'
];

const outputDir = path.join(__dirname, '..', 'public', 'database_api');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🚀 AVVIO DOWNLOAD DIRETTO E CREAZIONE INDICI...");

const downloadFile = (filename) => {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/${filename}.json`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.warn(`⚠️  File mancante: ${filename}`);
                res.resume();
                return resolve(null);
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const cleanList = json.filter(i => i.name && !i.name.includes("PH"));
                    const filePath = path.join(outputDir, `${filename}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(cleanList, null, 2));
                    console.log(`✅ Scaricato ${filename}: ${cleanList.length} oggetti.`);
                    resolve(cleanList); // Ritorniamo i dati per usarli subito
                } catch (e) {
                    console.error(`❌ Errore JSON ${filename}:`, e.message);
                    resolve(null);
                }
            });
        }).on('error', (err) => resolve(null));
    });
};

async function run() {
    let relicsData = [];

    for (const cat of categories) {
        const data = await downloadFile(cat);
        if (cat === 'Relics' && data) {
            relicsData = data;
        }
    }

    // --- GENERAZIONE FILE OTTIMIZZATO (LOOKUP) ---
    if (relicsData.length > 0) {
        console.log("⚙️  Generazione RelicLookup.json ottimizzato...");
        generateRelicLookup(relicsData);
    }
    
    console.log(`\n🎉 TUTTO COMPLETATO!`);
}

function generateRelicLookup(allRelics) {
    const lookup = {};

    allRelics.forEach(relic => {
        // Prendiamo solo le reliquie BASE (Intact)
        if (relic.name.match(/(Radiant|Flawless|Exceptional)/i)) return;

        // Estraiamo ID Standard: "Lith N13 Relic (Intact)" -> "LITH N13"
        const match = relic.name.toUpperCase().match(/(LITH|MESO|NEO|AXI|REQUIEM)\s+([A-Z0-9]+)/);
        if (!match) return;
        
        const id = `${match[1]} ${match[2]}`; // Es: "LITH N13"
        
        // Prepariamo la lista missioni pulita
        const missions = [];
        (relic.drops || []).forEach(drop => {
            let loc = drop.location;
            let rot = drop.rotation;
            
            // Estrazione Rotazione
            if (!rot) {
                const m = loc.match(/(?:Rotation|Rot)\s*([A-C])/i);
                if (m) {
                    rot = m[1].toUpperCase();
                    loc = loc.replace(/\s*\(?(?:Rotation|Rot)\s*[A-C]\)?/i, '').trim();
                } else rot = "-";
            }

            // Normalizza chance
            let chance = drop.chance || 0;
            if (chance === 0 && drop.rarity) {
                if (drop.rarity === 'Common') chance = 0.11;
                else if (drop.rarity === 'Uncommon') chance = 0.05;
                else if (drop.rarity === 'Rare') chance = 0.02;
            }

            missions.push({
                node: loc,  // Nome missione pulito
                rot: rot,   // Rotazione (A, B, C)
                chance: Number(chance.toFixed(4)) // Arrotonda per risparmiare spazio
            });
        });

        if (missions.length > 0) {
            lookup[id] = missions;
        }
    });

    // Salva il file
    fs.writeFileSync(path.join(outputDir, 'RelicLookup.json'), JSON.stringify(lookup));
    console.log(`📦 RelicLookup.json creato con successo (${Object.keys(lookup).length} reliquie indicizzate).`);
}

run();