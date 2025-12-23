"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Assicurati che questo file esista nella stessa cartella!
import './mods.css';

const STORAGE_KEY = 'warframe_codex_mods_v1';

function ModsPage() {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);
    
    // Filtri
    const [currentCategory, setCurrentCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSort, setCurrentSort] = useState('name');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    // Infinite Scroll
    const [visibleCount, setVisibleCount] = useState(60);
    const scrollRef = useRef(null);

    // 1. Caricamento Dati API
    useEffect(() => {
        let isMounted = true;
        
        async function loadData() {
            setLoading(true);
            try {
                // Fetch parallelo dei dati
                const [modsRes, arcanesRes] = await Promise.all([
                    fetch('https://unpkg.com/warframe-items/data/json/Mods.json'),
                    fetch('https://unpkg.com/warframe-items/data/json/Arcanes.json')
                ]);
                
                if (!isMounted) return;

                const modsData = await modsRes.json();
                const arcanesData = await arcanesRes.json();
                const combined = [...modsData, ...arcanesData];

                // Processiamo i dati
                const processed = [];
                const ids = new Set();

                combined.forEach(item => {
                    if (!item.imageName || item.name.includes("Riven") || (item.uniqueName && item.uniqueName.includes("/PVP"))) return;
                    if (ids.has(item.name)) return; 
                    
                    ids.add(item.name);
                    
                    const dropLocs = item.drops ? item.drops.map(d => d.location).join(" ") : "";
                    item.searchString = `${item.name} ${item.type} ${item.category || ""} ${dropLocs}`.toLowerCase();
                    
                    processed.push(item);
                });

                setRawApiData(processed);
                
                // Carica salvataggi SOLO lato client
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        setOwnedCards(new Set(JSON.parse(saved)));
                    } catch (e) {
                        console.error("Error parsing saved mods", e);
                    }
                }

            } catch (e) {
                console.error("Error loading mods:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadData();

        return () => { isMounted = false; };
    }, []);

    // 2. Salvataggio automatico (Solo quando loading è finito)
    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
        }
    }, [ownedCards, loading]);

    // 3. Filtraggio
    const filteredData = useMemo(() => {
        let data = rawApiData.filter(item => {
            if (searchTerm && !item.searchString.includes(searchTerm)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;
            
            const t = (item.type || "").toLowerCase();
            const slot = (item.slot || "").toLowerCase();
            const cat = (item.category || "").toLowerCase();
            const isAugment = item.isAugment || item.name.includes("Augment");
            const isAura = t.includes("aura") || slot === "aura";
            const isArcane = cat.includes("arcane") || t.includes("arcane");

            switch (currentCategory) {
                case 'all': return true;
                case 'warframe': return t.includes("warframe") && !isAura && !isAugment && !isArcane;
                case 'aura': return isAura;
                case 'augment': return isAugment;
                case 'arcane': return isArcane;
                case 'primary': return (t.includes("rifle") || t.includes("bow") || t.includes("shotgun") || t.includes("sniper")) && !isAugment;
                case 'secondary': return (t.includes("pistol") || t.includes("secondary")) && !isAugment;
                case 'melee': return (t.includes("melee")) && !isAugment;
                case 'exilus': return item.isExilus || slot === "exilus";
                case 'companion': return t.includes("companion") || t.includes("sentinel") || t.includes("beast");
                case 'archwing': return t.includes("archwing") || t.includes("arch-gun");
                default: return true;
            }
        });

        // Ordinamento
        const rarityMap = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Legendary': 4 };
        data.sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'drain') return (b.baseDrain || 0) - (a.baseDrain || 0);
            if (currentSort === 'rarity') {
                const rA = rarityMap[a.rarity] || 0;
                const rB = rarityMap[b.rarity] || 0;
                if (rA !== rB) return rB - rA;
                return a.name.localeCompare(b.name);
            }
            if (currentSort === 'chance') {
                const maxA = a.drops && a.drops.length ? Math.max(...a.drops.map(d=>d.chance)) : 0;
                const maxB = b.drops && b.drops.length ? Math.max(...b.drops.map(d=>d.chance)) : 0;
                return maxA - maxB;
            }
            return 0;
        });

        return data;
    }, [rawApiData, currentCategory, searchTerm, currentSort, showMissingOnly, ownedCards]);

    // Handlers
    const handleScroll = (e) => {
        if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 500) {
            setVisibleCount(prev => prev + 60);
        }
    };

    const toggleOwned = (id) => {
        const newSet = new Set(ownedCards);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setOwnedCards(newSet);
    };

    const resetData = () => {
        if(confirm("Reset all mods progress?")) {
            setOwnedCards(new Set());
        }
    };

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    // --- RENDER ---
    return (
        <div className="mods-container">
            {/* NAVIGATION */}
            <div className="mods-header-group">
                <div style={{display:'flex', gap:'5px', padding:'0 20px', overflowX:'auto', scrollbarWidth:'none', height:'50px'}}>
                    {['all','warframe','aura','augment','arcane','primary','secondary','melee','exilus','companion','archwing'].map(cat => (
                        <button 
                            key={cat}
                            className={`mods-nav-item ${currentCategory === cat ? 'active' : ''}`}
                            onClick={() => { setCurrentCategory(cat); setVisibleCount(60); }}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div style={{width:'100%', height:'3px', background:'#222'}}>
                    <div style={{height:'100%', background:'var(--rare)', width:`${pct}%`, transition:'0.5s'}}></div>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="mods-stats-bar">
                <div className="mods-controls-left">
                    <div style={{position:'relative'}}>
                        <input 
                            type="text" 
                            className="mods-search-input" 
                            placeholder="SEARCH..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                        />
                    </div>

                    <select className="mods-sort-select" onChange={(e) => setCurrentSort(e.target.value)}>
                        <option value="name">Sort: A-Z</option>
                        <option value="rarity">Sort: Rarity</option>
                        <option value="drain">Sort: Cost</option>
                        <option value="chance">Sort: % Drop</option>
                    </select>

                    <label className="mods-toggle">
                        <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                        <div className="mods-toggle-box">{showMissingOnly ? '✔' : ''}</div> Missing
                    </label>

                    <button className="mods-btn-action" onClick={resetData} style={{color:'#ff6b6b', borderColor:'#ff6b6b'}}>RESET</button>
                </div>
                
                <div style={{textAlign:'right', fontSize:'14px'}}>
                    <span style={{color:'#fff', fontWeight:'bold'}}>{ownedCards.size}</span> / <span style={{color:'#666'}}>{rawApiData.length}</span>
                    <span style={{color:'var(--rare)', fontWeight:'bold', marginLeft:'5px'}}>{pct}%</span>
                </div>
            </div>

            {/* GALLERY */}
            <div className="mods-gallery-container" onScroll={handleScroll} ref={scrollRef}>
                {loading ? (
                    <div className="mods-loading">Reading Database...</div>
                ) : (
                    <div className="mods-card-gallery">
                        {filteredData.slice(0, visibleCount).map(item => (
                            <ModCard 
                                key={item.uniqueName} 
                                item={item} 
                                isOwned={ownedCards.has(item.uniqueName)} 
                                onToggle={() => toggleOwned(item.uniqueName)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: MOD CARD ---
function ModCard({ item, isOwned, onToggle }) {
    const [flipped, setFlipped] = useState(false);
    const [rank, setRank] = useState(0);
    const maxRank = item.fusionLimit || 5;

    // Helper descrizione dinamica
    const getDescription = () => {
        let desc = item.description || "";
        if (item.levelStats && item.levelStats.length > 0) {
            const statIndex = Math.min(rank, item.levelStats.length - 1);
            return item.levelStats[statIndex].stats.join('<br>');
        }
        // Fallback regex
        return desc.replace(/(\d+(\.\d+)?)/g, (match) => {
            const maxVal = parseFloat(match);
            const baseVal = maxVal / (maxRank + 1);
            const currentVal = baseVal * (rank + 1);
            return currentVal % 1 === 0 ? currentVal.toFixed(0) : currentVal.toFixed(1).replace(/\.0$/, '');
        }).replace(/\r\n|\n/g, "<br>");
    };

    const displayDesc = getDescription();
    const currentDrain = (item.baseDrain || 0) + rank;
    const imgUrl = `https://cdn.warframestat.us/img/${encodeURIComponent(item.imageName)}`;
    
    const rarity = item.rarity || "Common";
    let nameColor = '#fff';
    if (rarity === 'Rare') nameColor = '#f0e68c';
    if (rarity === 'Legendary') nameColor = '#b0c9ec';
    if (item.category === 'Arcanes') nameColor = '#00ffcc';

    // Gestione Drops Retro
    const renderDrops = () => {
        if (!item.drops || item.drops.length === 0) return <div style={{textAlign:'center', color:'#666', marginTop:'20px'}}>Source Unknown / Quest / Market</div>;
        
        return item.drops.slice(0, 8).map((d, i) => (
            <div key={i} className="mod-drop-row">
                <div className="mod-drop-header">
                    <span style={{fontSize:'11px', color:'#ddd', fontWeight:'bold'}}>{d.location}</span>
                    <span style={{fontSize:'10px', color:'#aaa'}}>{(d.chance * 100).toFixed(2)}%</span>
                </div>
                <div style={{width:'100%', height:'3px', background:'#222', borderRadius:'2px'}}>
                    <div style={{width:`${Math.min(100, d.chance * 100 * 4)}%`, height:'100%', background:'var(--mission)'}}></div>
                </div>
            </div>
        ));
    };

    return (
        <div 
            className={`mod-card-wrapper ${isOwned ? 'owned' : ''} ${flipped ? 'flipped' : ''}`}
            data-rarity={rarity}
            onClick={() => setFlipped(!flipped)}
        >
            <div className="mod-card-inner">
                {/* FRONT */}
                <div className="mod-card-front">
                    <div className="mod-owned-check" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                        {isOwned ? '✔' : '+'}
                    </div>
                    <div className="mod-drain-box">
                        {currentDrain} {item.polarity && <span style={{fontSize:'10px'}}>{item.polarity.substring(0,1)}</span>}
                    </div>
                    
                    <div className="mod-card-img-container">
                        <img src={imgUrl} className="mod-card-img" alt={item.name} loading="lazy" />
                    </div>

                    <div className="mod-info-area">
                        <div className="mod-type-pill">{item.type}</div>
                        <div className="mod-name" style={{color: nameColor}}>{item.name}</div>
                        <div className="mod-desc" dangerouslySetInnerHTML={{__html: displayDesc}}></div>

                        <div className="mod-rank-controls" onClick={(e) => e.stopPropagation()}>
                            <button className="mod-rank-btn" onClick={() => setRank(Math.max(0, rank - 1))}>-</button>
                            <div className="mod-ranks-dots">
                                {Array.from({length: Math.min(10, maxRank + 1)}).map((_, i) => (
                                    <div key={i} className={`mod-dot ${i <= (rank / maxRank * 10) ? 'active' : ''}`}></div>
                                ))}
                            </div>
                            <button className="mod-rank-btn" onClick={() => setRank(Math.min(maxRank, rank + 1))}>+</button>
                        </div>
                    </div>
                </div>

                {/* BACK */}
                <div className="mod-card-back">
                    <div className="mod-back-header">
                        <div className="mod-back-title">ACQUISITION</div>
                        {item.tradable && <span style={{fontSize:'9px', color:'#2ecc71', border:'1px solid #2ecc71', padding:'2px'}}>TRADE</span>}
                    </div>
                    <div className="mod-source-content">
                        {renderDrops()}
                    </div>
                    <a href={`https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`} target="_blank" className="mod-wiki-btn" onClick={(e) => e.stopPropagation()}>
                        OPEN WIKI
                    </a>
                </div>
            </div>
        </div>
    );
}

// Export Finale (IMPORTANTE PER NEXT.JS)
export default ModsPage;