"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VirtuosoGrid } from 'react-virtuoso';
import { IMG_BASE_URL } from '@/utils/constants';
import RelicDetailModal from '@/components/RelicDetailModal'; 
import '@/app/hud-layout.css'; 

const STORAGE_KEY = 'warframe_codex_relics_v1';

export default function RelicsClientPage({ initialData = [] }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);

    // Filtri
    const [currentEra, setCurrentEra] = useState('all'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    
    // NUOVA LOGICA: showVaulted (False di default = Vaulted Nascosti)
    const [showVaulted, setShowVaulted] = useState(false);
    
    const [selectedItem, setSelectedItem] = useState(null);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchTerm); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Inizializzazione
    useEffect(() => {
        if(initialData && initialData.length > 0) {
            // Filtriamo solo le reliquie "Intact"
            const processed = initialData.filter(item => 
                item.name.includes('Intact') && 
                item.category === 'Relics'
            ).map(item => ({
                ...item,
                // Calcoliamo isVaulted
                isVaulted: !item.drops || item.drops.length === 0,
                // Nome pulito per visualizzazione e ricerca
                simpleName: item.name.replace(' Intact', '').replace(' Relic', '').trim()
            }));

            // Ordina per Era e poi per Nome
            const eraOrder = { 'Lith': 1, 'Meso': 2, 'Neo': 3, 'Axi': 4, 'Requiem': 5 };
            processed.sort((a, b) => {
                const eraA = a.name.split(' ')[0];
                const eraB = b.name.split(' ')[0];
                if (eraOrder[eraA] !== eraOrder[eraB]) return (eraOrder[eraA] || 9) - (eraOrder[eraB] || 9);
                return a.name.localeCompare(b.name);
            });

            setRawApiData(processed);
            setLoading(false);
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setOwnedCards(new Set(JSON.parse(saved))); } catch (e) { console.error(e); }
        }
    }, [initialData]);

    // Salvataggio
    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            const handler = setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
            }, 1000);
            return () => clearTimeout(handler);
        }
    }, [ownedCards, loading]);

    const filteredData = useMemo(() => {
        return rawApiData.filter(item => {
            if (debouncedSearch && !item.simpleName.toLowerCase().includes(debouncedSearch)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;
            
            // NUOVA LOGICA INVERTITA
            if (!showVaulted && item.isVaulted) return false;

            if (currentEra !== 'all') {
                if (!item.name.startsWith(currentEra)) return false;
            }
            return true;
        });
    }, [rawApiData, currentEra, debouncedSearch, showMissingOnly, showVaulted, ownedCards]);

    const toggleOwned = (id) => {
        const newSet = new Set(ownedCards);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setOwnedCards(newSet);
    };

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    if (loading) return <div style={{color:'#fff', padding:'50px', textAlign:'center'}}>DECODING VOID SIGNALS...</div>;

    return (
        <div className="codex-layout">
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">VOID RELICS</h1>
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
                            {['all', 'Lith', 'Meso', 'Neo', 'Axi', 'Requiem'].map(era => (
                                <button 
                                    key={era}
                                    className={`tab-btn ${currentEra === era ? 'active' : ''}`}
                                    onClick={() => setCurrentEra(era)}
                                >
                                    {era.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="filters-right">
                        <div className="search-wrapper">
                            <input 
                                type="text" className="search-input" placeholder="SEARCH RELIC..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>
                        
                        {/* CHECKBOX SHOW VAULTED */}
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={showVaulted} onChange={(e) => setShowVaulted(e.target.checked)} />
                            <div className="checkbox-custom">{showVaulted && '✓'}</div>
                            SHOW VAULTED
                        </label>

                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                            <div className="checkbox-custom">{showMissingOnly && '✓'}</div>
                            MISSING
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
                        List: (props) => <div {...props} className="card-gallery" style={{...props.style, display: 'flex', flexWrap: 'wrap', justifyContent:'center', gap:'20px', paddingBottom:'100px'}} />,
                        Item: (props) => <div {...props} style={{...props.style, margin: 0}} />
                    }}
                    itemContent={(index) => {
                        const item = filteredData[index];
                        return (
                            <div onClick={() => setSelectedItem(item)} style={{cursor:'pointer'}}>
                                <RelicCard 
                                    item={item} 
                                    isOwned={ownedCards.has(item.uniqueName)} 
                                    onToggle={() => toggleOwned(item.uniqueName)} 
                                />
                            </div>
                        );
                    }}
                />
            </div>

            {selectedItem && (
                <RelicDetailModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                    ownedItems={ownedCards} 
                    onToggle={toggleOwned} 
                />
            )}
        </div>
    );
}

// Card Semplice e Funzionale
function RelicCard({ item, isOwned, onToggle }) {
    const eraColor = {
        'Lith': '#a89686', // Bronze
        'Meso': '#c0c0c0', // Silver
        'Neo': '#d4af37', // Gold
        'Axi': '#b0c9ec', // Platinum
        'Requiem': '#ff4444' // Red
    };
    const era = item.name.split(' ')[0];
    const borderColor = eraColor[era] || '#444';

    return (
        <div className={`card-wrapper ${isOwned ? 'owned' : ''}`} style={{height:'280px', width:'180px', borderTop:`3px solid ${borderColor}`}}>
            <div className="card-image-container" style={{height:'140px', background: 'radial-gradient(circle, #222 0%, #111 100%)'}}>
                <div className="owned-check" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                    {isOwned ? '✔' : ''}
                </div>
                
                {item.isVaulted && <div className="vaulted-tag-card">VAULTED</div>}

                <Image 
                    src={`${IMG_BASE_URL}/${item.imageName}`} 
                    alt={item.name} 
                    fill
                    className="card-image-img"
                    style={{objectFit: 'contain', transform:'scale(0.8)'}}
                    unoptimized
                />
            </div>

            <div className="info-area" style={{justifyContent:'flex-start', padding:'15px 10px'}}>
                <div className="type-pill" style={{color: borderColor, borderColor: borderColor}}>{era} ERA</div>
                <div className="mod-name" style={{fontSize:'16px'}}>{item.simpleName.split(' ')[1]}</div>
                <div style={{fontSize:'10px', color:'#666', marginTop:'5px'}}>
                    {item.isVaulted ? "Archived Relic" : "Available in Mission"}
                </div>
            </div>
        </div>
    );
}