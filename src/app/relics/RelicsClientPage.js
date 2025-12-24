"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VirtuosoGrid } from 'react-virtuoso';
import { IMG_BASE_URL } from '@/utils/constants';
import RelicDetailModal from '@/components/RelicDetailModal'; 
import '@/app/hud-layout.css'; 
import './relics.css'; // IMPORTANTE

const STORAGE_KEY = 'warframe_codex_relics_v1';

export default function RelicsClientPage({ initialData = [] }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const [currentEra, setCurrentEra] = useState('all'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [hideVaulted, setHideVaulted] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchTerm); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if(initialData && initialData.length > 0) {
            const processed = initialData.filter(item => 
                item.name.includes('Intact') && 
                item.category === 'Relics'
            ).map(item => ({
                ...item,
                isVaulted: !item.drops || item.drops.length === 0,
                // Estrae "G1" da "Lith G1 Relic (Intact)"
                code: item.name.split(' ')[1],
                // Estrae "Lith"
                era: item.name.split(' ')[0],
                simpleName: item.name.replace(' Relic (Intact)', '').trim()
            }));

            const eraOrder = { 'Lith': 1, 'Meso': 2, 'Neo': 3, 'Axi': 4, 'Requiem': 5 };
            processed.sort((a, b) => {
                if (eraOrder[a.era] !== eraOrder[b.era]) return (eraOrder[a.era] || 9) - (eraOrder[b.era] || 9);
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
            if (hideVaulted && item.isVaulted) return false;
            if (currentEra !== 'all' && item.era !== currentEra) return false;
            return true;
        });
    }, [rawApiData, currentEra, debouncedSearch, showMissingOnly, hideVaulted, ownedCards]);

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
                                type="text" className="search-input" placeholder="SEARCH (Ex: G1)..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={hideVaulted} onChange={(e) => setHideVaulted(e.target.checked)} />
                            <div className="checkbox-custom">{hideVaulted && '✓'}</div>
                            HIDE VAULTED
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
                        List: (props) => <div {...props} className="card-gallery" style={{...props.style, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', paddingBottom:'100px'}} />,
                        Item: (props) => <div {...props} style={{...props.style, margin: 0}} />
                    }}
                    itemContent={(index) => {
                        const item = filteredData[index];
                        return (
                            <div onClick={() => setSelectedItem(item)} style={{height: '100%'}}>
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

// Nuova Card con Design Aggiornato
function RelicCard({ item, isOwned, onToggle }) {
    return (
        <div 
            className={`relic-card-advanced ${item.isVaulted ? 'is-vaulted' : ''} ${isOwned ? 'owned' : ''}`}
            data-era={item.era}
        >
            <div className="relic-era-bar"></div>
            
            <div className="relic-check" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                {isOwned ? '✓' : ''}
            </div>

            <div className="relic-img-wrapper">
                <Image 
                    src={`${IMG_BASE_URL}/${item.imageName}`} 
                    alt={item.name} 
                    fill
                    className="relic-img"
                    unoptimized
                />
            </div>

            <div className="relic-info">
                <div className="relic-era-label">{item.era}</div>
                <div className="relic-code">{item.code}</div>
                <div className="relic-status-badge">
                    {item.isVaulted ? "VAULTED" : "AVAILABLE"}
                </div>
            </div>
        </div>
    );
}