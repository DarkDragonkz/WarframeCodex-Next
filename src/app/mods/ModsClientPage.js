"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VirtuosoGrid } from 'react-virtuoso';
import { IMG_BASE_URL } from '@/utils/constants';
// Assicurati di aver creato questo file come indicato nel PASSO 1
import { getBasePath } from '@/utils/basePath'; 
import '@/app/hud-layout.css'; 
import './mods.css';

const STORAGE_KEY = 'warframe_codex_mods_v1';

export default function ModsClientPage({ initialData = [] }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const [currentCategory, setCurrentCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentSort, setCurrentSort] = useState('name');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchTerm); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // INIZIALIZZAZIONE DATI
    useEffect(() => {
        if(initialData && initialData.length > 0) {
            const uniqueMap = new Map();
            initialData.forEach(item => {
                if(!item.imageName || item.name.includes("Riven") || (item.uniqueName && item.uniqueName.includes("/PVP"))) return;
                
                let cleanDesc = "";
                if (item.description) {
                    cleanDesc = Array.isArray(item.description) ? item.description.join(" ") : item.description;
                }
                
                if ((!cleanDesc || cleanDesc === "") && item.levelStats && item.levelStats.length > 0) {
                    const lastStat = item.levelStats[item.levelStats.length - 1];
                    if (lastStat && lastStat.stats) {
                        cleanDesc = lastStat.stats.join(" ");
                    }
                }

                if(!uniqueMap.has(item.name)) {
                    uniqueMap.set(item.name, {
                        ...item,
                        description: cleanDesc,
                        maxRank: (typeof item.fusionLimit === 'number') ? item.fusionLimit : 5,
                        baseDrain: item.baseDrain || 2,
                        searchStr: `${item.name} ${item.type} ${item.category}`.toLowerCase()
                    });
                }
            });
            const processed = Array.from(uniqueMap.values()).sort((a,b) => a.name.localeCompare(b.name));
            setRawApiData(processed);
            setLoading(false);
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setOwnedCards(new Set(JSON.parse(saved))); } catch (e) {}
        }
    }, [initialData]);

    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
        }
    }, [ownedCards, loading]);

    const filteredData = useMemo(() => {
        let data = rawApiData.filter(item => {
            if (debouncedSearch && !item.searchStr.includes(debouncedSearch)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;

            const t = (item.type || "").toLowerCase();
            const cat = (item.category || "").toLowerCase();
            const slot = (item.slot || "").toLowerCase();
            const isAugment = item.isAugment || item.name.includes("Augment");
            const isArcane = cat.includes("arcane") || t.includes("arcane");

            switch (currentCategory) {
                case 'all': return true;
                case 'warframe': return t.includes("warframe") && !isAugment && !isArcane;
                case 'aura': return t.includes("aura") || slot === "aura";
                case 'augment': return isAugment;
                case 'arcane': return isArcane;
                case 'primary': return (t.includes("rifle") || t.includes("bow") || t.includes("shotgun") || t.includes("sniper")) && !isAugment;
                case 'secondary': return (t.includes("pistol") || t.includes("secondary")) && !isAugment;
                case 'melee': return t.includes("melee") && !isAugment;
                case 'companion': return t.includes("companion") || t.includes("sentinel") || t.includes("beast");
                case 'archwing': return t.includes("archwing") || t.includes("arch-gun");
                default: return true;
            }
        });

        const rarityMap = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Legendary': 4, 'Arcane': 5 };
        data.sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'drain') return (b.baseDrain || 0) - (a.baseDrain || 0);
            if (currentSort === 'rarity') {
                const rA = rarityMap[a.rarity] || 0;
                const rB = rarityMap[b.rarity] || 0;
                if (rA !== rB) return rB - rA;
                return a.name.localeCompare(b.name);
            }
            return 0;
        });
        return data;
    }, [rawApiData, debouncedSearch, currentCategory, currentSort, showMissingOnly, ownedCards]);

    const toggleOwned = (id) => {
        const newSet = new Set(ownedCards);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setOwnedCards(newSet);
    };

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    if (loading) return <div style={{color:'#fff', padding:'50px', textAlign:'center'}}>LOADING MOD MODULES...</div>;

    return (
        <div className="codex-layout">
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">MODS & ARCANES</h1>
                    </div>
                    <div className="stats-right">
                        <div className="stat-box">
                            <div className="stat-label">COLLECTED</div>
                            <div className="stat-value"><span>{ownedCards.size}</span> / {rawApiData.length}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">COMPLETION</div>
                            <div className="stat-value">{pct}%</div>
                        </div>
                    </div>
                </div>

                <div className="controls-row">
                    <div className="filters-left" style={{overflowX:'auto'}}>
                        <div className="category-tabs">
                            {['all','warframe','aura','augment','arcane','primary','secondary','melee','companion','archwing'].map(cat => (
                                <button 
                                    key={cat}
                                    className={`tab-btn ${currentCategory === cat ? 'active' : ''}`}
                                    onClick={() => setCurrentCategory(cat)}
                                >
                                    {cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="filters-right">
                        <div className="search-wrapper">
                            <input 
                                type="text" className="search-input" placeholder="SEARCH MOD..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>

                        <select 
                            className="search-input" 
                            style={{width:'auto', cursor:'pointer'}}
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                        >
                            <option value="name">NAME</option>
                            <option value="rarity">RARITY</option>
                            <option value="drain">COST</option>
                        </select>

                        <label className="toggle-filter" style={{display:'flex', alignItems:'center', gap:'5px', color:'#ccc', fontSize:'10px', fontWeight:'bold', cursor:'pointer', border:'1px solid #444', padding:'5px 10px', borderRadius:'4px', background: showMissingOnly ? 'rgba(255,255,255,0.1)' : 'transparent'}}>
                            <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                            <span style={{color: showMissingOnly ? '#5fffa5' : '#666'}}>
                                {showMissingOnly ? '✓ MISSING ONLY' : 'SHOW MISSING'}
                            </span>
                        </label>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

            <div className="gallery-scroll-area">
                <VirtuosoGrid
                    style={{ height: '100%', width: '100%' }}
                    totalCount={filteredData.length}
                    overscan={200}
                    components={{
                        List: (props) => <div {...props} className="card-gallery" style={{...props.style, display: 'flex', flexWrap: 'wrap', justifyContent:'center', gap:'25px', paddingBottom: '100px'}} />,
                        Item: (props) => <div {...props} style={{...props.style, margin: 0}} />
                    }}
                    itemContent={(index) => {
                        const item = filteredData[index];
                        return (
                            <div style={{padding:'0'}}>
                                <ModCard 
                                    item={item} 
                                    isOwned={ownedCards.has(item.uniqueName)} 
                                    onToggle={() => toggleOwned(item.uniqueName)} 
                                />
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
}

// --- MOD CARD COMPONENT ---
function ModCard({ item, isOwned, onToggle }) {
    const [flipped, setFlipped] = useState(false);
    const maxRank = item.maxRank || 0;
    const [rank, setRank] = useState(0); 

    const getDescription = () => {
        if (item.levelStats && item.levelStats.length > 0) {
            const statIndex = Math.min(rank, item.levelStats.length - 1);
            if(item.levelStats[statIndex] && item.levelStats[statIndex].stats) {
                return item.levelStats[statIndex].stats.join(" ")
                    .replace(/(\d+(\.\d+)?%?)/g, "<b>$1</b>")
                    .replace(/\r\n|\n/g, "<br>");
            }
        }
        if(!item.description) return "Description unavailable.";
        return item.description.replace(/(\d+(\.\d+)?)/g, (match) => {
            const val = parseFloat(match);
            if(isNaN(val) || val > 1000) return match; 
            const scaled = (val / (maxRank + 1)) * (rank + 1);
            if(!isFinite(scaled)) return match;
            const fmt = Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace(/\.0$/, '');
            return `<b>${fmt}</b>`;
        }).replace(/\r\n|\n/g, "<br>");
    };

    const wikiUrl = `https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`;
    
    // --- MAPPA POLARITÀ CORRETTA ---
    const getPolarityIcon = () => {
        if (!item.polarity) return null;
        const p = item.polarity.toLowerCase().trim();
        
        // Mappa i nomi. NOTA: Assicurati che le estensioni siano corrette (SVG vs PNG)
        const map = {
            'madurai': 'madurai.svg',
            'naramon': 'naramon.svg',
            'vazarin': 'vazarin.svg',
            'zenurik': 'zenurik.svg',
            'unairu': 'unairu.svg',
            'penjaga': 'penjaga.svg',
            'universal': 'any.svg',
            'umbra': 'umbra.svg'
        };

        const fileName = map[p] || (p.charAt(0).toUpperCase() + p.slice(1) + '.svg');
        
        // MODIFICA CRITICA: Usa getBasePath per risolvere l'URL su GitHub Pages
        return getBasePath(`polarities/${fileName}`);
    };

    const polIconUrl = getPolarityIcon();
    const currentDrain = (item.baseDrain || 0) + rank;

    const increaseRank = (e) => { e.stopPropagation(); setRank(Math.min(maxRank, rank + 1)); };
    const decreaseRank = (e) => { e.stopPropagation(); setRank(Math.max(0, rank - 1)); };

    const renderDrops = () => {
        if (!item.drops || item.drops.length === 0) return <div style={{padding:'20px', fontStyle:'italic', color:'#555', textAlign:'center', fontSize:'11px'}}>Source Unknown / Quest</div>;
        
        return item.drops.slice(0, 10).map((d, i) => {
            let typeClass = 'enemy';
            if(d.location.includes("Rot") || d.type?.includes("Mission") || d.type?.includes("Bounty")) typeClass = 'mission';
            else if(d.location.includes("Syndicate") || d.type?.includes("Offering")) typeClass = 'other';

            return (
                <div key={i} className="drop-item">
                    <div className="drop-name">
                        <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                            <span className={`dot-leg ${typeClass}`}></span>
                            <span style={{maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.location}</span>
                        </div>
                        <span className="drop-chance">{(d.chance * 100).toFixed(2)}%</span>
                    </div>
                    <div className="drop-meta">
                        <span>{d.rotation ? `Rot ${d.rotation}` : ''}</span>
                        <span style={{color: getRarityColor(d.rarity)}}>{d.rarity}</span>
                    </div>
                </div>
            );
        });
    };

    return (
        <div 
            className={`mod-card-wrapper ${isOwned ? 'owned' : ''} ${flipped ? 'flipped' : ''}`}
            data-rarity={item.rarity || 'Common'}
            onClick={() => setFlipped(!flipped)}
        >
            <div className="mod-card-inner">
                
                {/* FRONT */}
                <div className="mod-card-front">
                    <div className="mod-image-area">
                        <Image src={`${IMG_BASE_URL}/${item.imageName}`} alt={item.name} fill className="mod-img" unoptimized />
                    </div>
                    <div className="mod-top-bar">
                        <div className={`mod-status-btn ${isOwned ? 'owned' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                            {isOwned ? 'OWNED' : 'MISSING'}
                        </div>
                        <div className="mod-drain-box">
                            <span>{currentDrain}</span>
                            {polIconUrl && (
                                <img 
                                    src={polIconUrl} 
                                    alt={item.polarity} 
                                    className="mod-polarity-icon" 
                                    // MODIFICA CRITICA: Invert(1) rende bianche le icone nere
                                    style={{ filter: 'invert(1)', width: '16px', height: '16px' }}
                                    onError={(e) => e.target.style.display='none'} 
                                />
                            )}
                        </div>
                    </div>
                    <div className="mod-info-front">
                        <div className="mod-type-badge">{item.type}</div>
                        <div className="mod-name" style={{color: getRarityColor(item.rarity)}}>{item.name}</div>
                        <div className="mod-desc-text" dangerouslySetInnerHTML={{__html: getDescription()}} />
                        {maxRank > 0 && (
                            <div className="mod-rank-controls" onClick={(e) => e.stopPropagation()}>
                                <div className="rank-buttons-row">
                                    <div className="rank-btn" onClick={decreaseRank}>-</div>
                                    <div className="rank-label">RANK {rank}/{maxRank}</div>
                                    <div className="rank-btn" onClick={increaseRank}>+</div>
                                </div>
                                <div className="mod-rank-dots-container">
                                    {Array.from({length: maxRank}).map((_, i) => (
                                        <div key={i} className={`rank-dot ${i < rank ? 'active' : ''}`}></div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BACK */}
                <div className="mod-card-back">
                    <div className="mod-back-header">
                        <div className="mod-back-top">
                            <span className="back-title">DROP SOURCES</span>
                            <span className="flip-icon" onClick={(e) => { e.stopPropagation(); setFlipped(false); }}>↺</span>
                        </div>
                        <div className="mod-drop-legend">
                            <span className="legend-item"><span className="dot-leg mission"></span> MISSION</span>
                            <span className="legend-item"><span className="dot-leg enemy"></span> ENEMY</span>
                            <span className="legend-item"><span className="dot-leg other"></span> OTHER</span>
                        </div>
                    </div>
                    <div className="mod-drops-list">
                        {renderDrops()}
                    </div>
                    <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="mod-wiki-link" onClick={(e) => e.stopPropagation()}>
                        OPEN WIKI
                    </a>
                </div>

            </div>
        </div>
    );
}

function getRarityColor(rarity) {
    switch(rarity) {
        case 'Rare': return '#d4af37';
        case 'Legendary': return '#b0c9ec';
        case 'Arcane': return '#00ffcc';
        case 'Uncommon': return '#c0c0c0';
        default: return '#fff';
    }
}