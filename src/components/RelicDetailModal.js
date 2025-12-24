"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { IMG_BASE_URL } from '@/utils/constants';
import './WarframeDetailModal.css'; 

export default function RelicDetailModal({ item, onClose, ownedItems, onToggle }) {
    if (!item) return null;

    const isOwned = ownedItems.has(item.uniqueName);
    const isVaulted = !item.drops || item.drops.length === 0;

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const sortedRewards = item.rewards ? [...item.rewards].sort((a, b) => a.chance - b.chance) : [];

    const getRarityConfig = (chance) => {
        if (chance > 0.20) return { color: '#cd7f32', name: 'COMMON' }; 
        if (chance > 0.10) return { color: '#c0c0c0', name: 'UNCOMMON' }; 
        return { color: '#d4af37', name: 'RARE' }; 
    };

    // --- FUNZIONE DI PARSING ---
    // Input: "Ceres/Hapke (Spy), Rotation B"
    // Output: { planet: "Ceres", node: "Hapke", type: "Spy", rot: "B" }
    const parseLocation = (locString) => {
        try {
            // Rimuove eventuali residui come "Lith G14 Relic"
            let clean = locString.split(',')[0]; // Prendi tutto prima della virgola (Rotation è di solito dopo)
            let rotation = locString.match(/Rotation\s+([A-C])/i)?.[1] || "-";
            
            // "Ceres/Hapke (Spy)" -> split "/"
            let parts = clean.split('/');
            let planet = parts[0].trim();
            let rest = parts[1] || "";

            // "Hapke (Spy)" -> extract node and type
            let node = rest.split('(')[0].trim();
            let typeMatch = rest.match(/\((.*?)\)/);
            let type = typeMatch ? typeMatch[1] : "Mission";

            return { planet, node, type, rotation };
        } catch (e) {
            return { planet: locString, node: "-", type: "-", rotation: "-" };
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-simple" onClick={(e) => e.stopPropagation()} style={{maxWidth:'1200px', height:'85vh'}}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    {/* COLONNA SINISTRA */}
                    <div className="col-left" style={{flex: '0 0 40%', borderRight:'1px solid #333', background:'#050505'}}>
                        <div className="modal-info-header" style={{textAlign:'center'}}>
                            <h2 className="modal-title" style={{fontSize:'42px', color: isVaulted ? '#ff5555' : '#fff'}}>
                                {item.simpleName}
                            </h2>
                            <div style={{marginTop:'10px'}}>
                                {isVaulted 
                                    ? <div className="vault-badge is-vaulted">VAULTED RELIC</div> 
                                    : <div className="vault-badge is-available">AVAILABLE IN MISSION</div>
                                }
                            </div>
                        </div>

                        <div className="det-img-box" style={{height:'200px', margin:'20px 0'}}>
                            <Image 
                                src={`${IMG_BASE_URL}/${item.imageName}`} 
                                alt={item.name} 
                                fill
                                style={{objectFit:'contain'}}
                                unoptimized
                            />
                        </div>

                        <div className="col-header-sticky" style={{background:'transparent', padding:'0 0 10px 0', border: 'none'}}>
                            <h3 className="section-title">POSSIBLE REWARDS</h3>
                        </div>

                        <div className="col-content-scroll" style={{padding:'0', flex:1}}>
                            {sortedRewards.map((r, i) => {
                                const conf = getRarityConfig(r.chance);
                                return (
                                    <div key={i} style={{
                                        marginBottom:'8px', 
                                        background:'linear-gradient(90deg, #18181b 0%, #121214 100%)', 
                                        padding:'10px 15px', 
                                        borderRadius:'4px', 
                                        borderLeft:`4px solid ${conf.color}`,
                                        borderBottom:'1px solid #222'
                                    }}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px'}}>
                                            <span style={{color: conf.name === 'RARE' ? '#d4af37' : '#eee', fontWeight:'bold', fontSize:'13px'}}>
                                                {r.itemName || "Unknown Item"}
                                            </span>
                                            <span style={{color: conf.color, fontSize:'12px', fontWeight:'900'}}>
                                                {(r.chance * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        {/* Barra Visiva */}
                                        <div style={{width:'100%', height:'4px', background:'#222', borderRadius:'2px', overflow:'hidden'}}>
                                            <div style={{
                                                width: `${Math.min(100, r.chance * 100 * 2)}%`, 
                                                height:'100%', 
                                                background: conf.color,
                                                boxShadow: `0 0 10px ${conf.color}`
                                            }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="det-actions" style={{marginTop:'20px'}}>
                            <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                                {isOwned ? '✔ IN COLLECTION' : '+ ADD TO COLLECTION'}
                            </button>
                        </div>
                    </div>

                    {/* COLONNA DESTRA: Drop Locations (Nuova Tabella) */}
                    <div className="col-center" style={{flex: 1, background:'#0e0e10', padding:'0'}}>
                        <div className="col-header-sticky" style={{background:'#1a1a1e', borderBottom:'1px solid #333', padding:'20px'}}>
                            <h3 className="section-title">DROP LOCATIONS</h3>
                        </div>
                        
                        <div className="col-content-scroll" style={{padding:'0'}}>
                            {!isVaulted ? (
                                <table style={{width:'100%', borderCollapse:'collapse'}}>
                                    <thead style={{position:'sticky', top:0, background:'#0e0e10', zIndex:10}}>
                                        <tr>
                                            <th style={thStyle}>PLANET</th>
                                            <th style={thStyle}>NODE</th>
                                            <th style={thStyle}>TYPE</th>
                                            <th style={{...thStyle, textAlign:'center'}}>ROT</th>
                                            <th style={{...thStyle, textAlign:'right'}}>CHANCE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.drops.sort((a,b) => b.chance - a.chance).map((drop, idx) => {
                                            const info = parseLocation(drop.location);
                                            return (
                                                <tr key={idx} style={{borderBottom:'1px solid #1a1a1e'}}>
                                                    <td style={{...tdStyle, color:'#fff', fontWeight:'bold'}}>{info.planet}</td>
                                                    <td style={{...tdStyle, color:'#ccc'}}>{info.node}</td>
                                                    <td style={{...tdStyle, color:'#888', fontSize:'11px', textTransform:'uppercase'}}>{info.type}</td>
                                                    <td style={{...tdStyle, textAlign:'center', color:'var(--gold)', fontWeight:'bold'}}>{info.rotation}</td>
                                                    <td style={{...tdStyle, textAlign:'right', color:'#5fffa5', fontWeight:'bold'}}>
                                                        {(drop.chance * 100).toFixed(2)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{
                                    height:'100%', display:'flex', flexDirection:'column', 
                                    alignItems:'center', justifyContent:'center', color:'#666', textAlign:'center'
                                }}>
                                    <div style={{fontSize:'60px', marginBottom:'20px', opacity:0.3}}>🔒</div>
                                    <h3 style={{color:'#ff5555', marginBottom:'10px'}}>PRIME VAULT SEALED</h3>
                                    <p style={{maxWidth:'300px', lineHeight:'1.5', fontSize:'13px'}}>
                                        This Relic has been retired from the drop tables.<br/>
                                        It cannot be farmed currently.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stili inline per tabella (per pulizia)
const thStyle = {
    padding: '12px 15px',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: '800',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const tdStyle = {
    padding: '12px 15px',
    fontSize: '13px'
};