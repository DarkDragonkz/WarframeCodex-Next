"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { IMG_BASE_URL } from '@/utils/constants';
import './WarframeDetailModal.css'; // Riutilizziamo il CSS esistente per coerenza

export default function RelicDetailModal({ item, onClose, ownedItems, onToggle }) {
    if (!item) return null;

    const isOwned = ownedItems.has(item.uniqueName);
    // Una reliquia è vaulted se non ha luoghi di drop
    const isVaulted = !item.drops || item.drops.length === 0;

    // Chiudi con ESC
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Ordina le ricompense per rarità (Common -> Uncommon -> Rare)
    const sortedRewards = item.rewards ? [...item.rewards].sort((a, b) => (b.chance || 0) - (a.chance || 0)) : [];

    const getRarityColor = (chance) => {
        if (chance > 0.20) return '#cd7f32'; // Bronze/Common
        if (chance > 0.10) return '#c0c0c0'; // Silver/Uncommon
        return '#d4af37'; // Gold/Rare
    };

    const getRarityName = (chance) => {
        if (chance > 0.20) return 'COMMON';
        if (chance > 0.10) return 'UNCOMMON';
        return 'RARE';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-simple" onClick={(e) => e.stopPropagation()} style={{maxWidth:'1200px'}}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    {/* COLONNA SINISTRA: INFO E CONTENUTO */}
                    <div className="col-left" style={{flex: '0 0 40%'}}>
                        <div className="modal-info-header">
                            <h2 className="modal-title">{item.name.replace(' Intact', '')}</h2>
                            <div className="type-pill">{item.type}</div>
                            <div style={{marginTop:'10px'}}>
                                {isVaulted 
                                    ? <div className="vault-badge is-vaulted">VAULTED</div> 
                                    : <div className="vault-badge is-available">AVAILABLE</div>
                                }
                            </div>
                        </div>

                        <div className="det-img-box" style={{height:'200px'}}>
                            <Image 
                                src={`${IMG_BASE_URL}/${item.imageName}`} 
                                alt={item.name} 
                                fill
                                style={{objectFit:'contain'}}
                                unoptimized
                            />
                        </div>

                        <h3 className="section-title" style={{marginTop:'20px', marginBottom:'15px'}}>POSSIBLE REWARDS</h3>
                        <div className="col-content-scroll" style={{padding:'0'}}>
                            {sortedRewards.map((r, i) => (
                                <div key={i} style={{marginBottom:'10px', background:'#18181b', padding:'10px', borderRadius:'4px', borderLeft:`4px solid ${getRarityColor(r.chance)}`}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                        <span style={{color:'#fff', fontWeight:'bold', fontSize:'13px'}}>{r.itemName || "Unknown Item"}</span>
                                        <span style={{color: getRarityColor(r.chance), fontSize:'11px', fontWeight:'800'}}>{(r.chance * 100).toFixed(0)}%</span>
                                    </div>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <span style={{fontSize:'10px', color:'#666'}}>{getRarityName(r.chance)}</span>
                                        {/* Barra visuale percentuale */}
                                        <div style={{width:'100px', height:'4px', background:'#333', borderRadius:'2px'}}>
                                            <div style={{width:`${r.chance * 100 * 2}%`, maxWidth:'100%', height:'100%', background: getRarityColor(r.chance)}}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="det-actions">
                            <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                                {isOwned ? '✔ COLLECTED' : '+ ADD TO COLLECTION'}
                            </button>
                        </div>
                    </div>

                    {/* COLONNA DESTRA: FARMING LOCATIONS */}
                    <div className="col-center" style={{flex: 1, borderRight:'none'}}>
                        <div className="col-header-sticky">
                            <h3 className="section-title">DROP LOCATIONS</h3>
                        </div>
                        
                        <div className="col-content-scroll">
                            {!isVaulted ? (
                                <table className="mission-relics-table">
                                    <thead>
                                        <tr>
                                            <th style={{textAlign:'left'}}>LOCATION</th>
                                            <th style={{textAlign:'left'}}>MISSION</th>
                                            <th style={{textAlign:'center'}}>ROT</th>
                                            <th style={{textAlign:'right'}}>CHANCE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.drops.sort((a,b) => b.chance - a.chance).map((drop, idx) => (
                                            <tr key={idx}>
                                                <td style={{fontWeight:'bold', color:'#ddd'}}>{drop.location}</td>
                                                <td style={{color:'#888', fontSize:'11px'}}>{drop.type}</td>
                                                <td style={{textAlign:'center', color:'var(--gold)'}}>{drop.rotation || "-"}</td>
                                                <td style={{textAlign:'right', color:'var(--blue-energy)', fontWeight:'bold'}}>
                                                    {(drop.chance * 100).toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="strategy-placeholder">
                                    <div style={{fontSize:'40px', marginBottom:'10px'}}>🔒</div>
                                    This Relic is currently <strong>Vaulted</strong>.<br/>
                                    It does not drop from any mission.<br/>
                                    <span style={{fontSize:'11px', color:'#666'}}>(You can still trade it with other players)</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* La terza colonna non serve per le reliquie, usiamo layout a 2 */}
                </div>
            </div>
        </div>
    );
}