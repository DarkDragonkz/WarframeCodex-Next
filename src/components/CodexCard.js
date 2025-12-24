"use client";
import { useState, memo } from 'react';
import { IMG_BASE_URL } from '@/utils/constants';

const getStatAtRank = (rank, maxRank, descriptionTemplate, levelStats) => {
    if (levelStats && levelStats.length > 0) {
        let statsArray = levelStats[rank] ? levelStats[rank].stats : levelStats[levelStats.length - 1].stats;
        return statsArray.join('<br>');
    }
    if (!descriptionTemplate) return "";
    return descriptionTemplate.replace(/(\d+(\.\d+)?)/g, (match) => {
        const maxVal = parseFloat(match);
        const baseVal = maxVal / (maxRank + 1);
        const currentVal = baseVal * (rank + 1);
        return currentVal % 1 === 0 ? currentVal.toFixed(0) : currentVal.toFixed(1).replace(/\.0$/, '');
    }).replace(/\r\n|\n/g, "<br>");
};

const CodexCard = memo(function CodexCard({ item, isOwned, onToggleOwned }) {
    const [rank, setRank] = useState(item.maxRank || 0);

    const isMod = item.category === 'Mods';
    const isArcane = item.category === 'Arcanes';
    const isPrime = item.name.includes("Prime");
    
    // --- LOGICA PURA: SI BASA SOLO SUL DATO SCRITTO ---
    const isVaulted = !!item.vaulted;

    const updateRank = (e, change) => {
        e.stopPropagation();
        let newRank = rank + change;
        if (newRank < 0) newRank = 0;
        if (newRank > item.maxRank) newRank = item.maxRank;
        setRank(newRank);
    };

    let displayDesc = item.description || "Nessuna descrizione.";
    if (isMod || isArcane) {
        displayDesc = getStatAtRank(rank, item.maxRank, item.rawDescription || item.description, item.levelStats);
    }
    
    displayDesc = displayDesc.replace(/<br>/g, " <br/> ");

    return (
        <div className={`card-wrapper ${isOwned ? 'owned' : ''}`} data-rarity={item.rarity || (isPrime ? 'Prime' : 'Common')}>
            
            <div className="card-image-container">
                <div className="owned-check" onClick={(e) => { e.stopPropagation(); onToggleOwned(item.uniqueName); }}>
                    {isOwned ? '✔' : ''}
                </div>

                {/* Mostra ETICHETTA solo se il dato dice che è Vaulted */}
                {isVaulted && <div className="vaulted-tag-card">VAULTED</div>}

                {(item.baseDrain || item.polarityIcon) && (isMod || isArcane) && (
                    <div className="drain-box">
                        {item.baseDrain ? (item.baseDrain + rank) : ""}
                        {item.polarityIcon && <img src={item.polarityIcon} className="polarity-icon" alt="pol" />}
                    </div>
                )}

                {item.imageName ? (
                    <img 
                        src={`${IMG_BASE_URL}/${item.imageName}`} 
                        className="card-image-img" 
                        loading="lazy" 
                        alt={item.name}
                        style={isArcane ? { transform: 'scale(0.7)' } : {}} 
                    />
                ) : <div style={{fontSize:'10px', color:'#666'}}>{item.name}</div>}
            </div>

            <div className="info-area">
                <div className="type-pill">{item.type}</div>
                <div className="mod-name" style={{color: isPrime ? 'var(--gold)' : '#fff'}}>
                    {item.name}
                </div>
                
                <div className="card-desc" dangerouslySetInnerHTML={{__html: displayDesc}}></div>

                {(isMod || isArcane) && item.maxRank > 0 && (
                    <div className="rank-controls-container">
                        <button className="rank-btn" onClick={(e) => updateRank(e, -1)}>-</button>
                        <div className="ranks-dots">
                            {Array.from({length: Math.min(item.maxRank + 1, 10)}).map((_, i) => (
                                <div key={i} className={`dot ${i <= (rank / item.maxRank * Math.min(item.maxRank, 9)) ? 'active' : ''}`}></div>
                            ))}
                        </div>
                        <button className="rank-btn" onClick={(e) => updateRank(e, 1)}>+</button>
                    </div>
                )}

                <a href={`https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`} target="_blank" className="wiki-btn-block" onClick={(e) => e.stopPropagation()}>
                    WIKI
                </a>
            </div>
        </div>
    );
});

export default CodexCard;