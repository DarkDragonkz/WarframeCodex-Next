"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { API_BASE_URL, IMG_BASE_URL } from '@/utils/constants';
import './homepage.css';

// CONFIGURAZIONE CATEGORIE (Amps rimosso)
const CATEGORIES = [
    { id: 'warframes', title: 'Warframes', subtitle: 'The Arsenal', color: '#d4af37', link: '/warframes', jsonFile: 'Warframes.json' },
    { id: 'primary', title: 'Primary', subtitle: 'Rifles & Bows', color: '#ff6b6b', link: '/primary', jsonFile: 'Primary.json' },
    { id: 'secondary', title: 'Secondary', subtitle: 'Pistols', color: '#ff9f43', link: '/secondary', jsonFile: 'Secondary.json' },
    { id: 'melee', title: 'Melee', subtitle: 'Blades & Whips', color: '#feca57', link: '/melee', jsonFile: 'Melee.json' },
    { id: 'mods', title: 'Mods', subtitle: 'Upgrades', color: '#54a0ff', link: '/mods', jsonFile: 'Mods.json' },
    { id: 'relics', title: 'Relics', subtitle: 'Void Fissures', color: '#00d2d3', link: '/relics', jsonFile: 'Relics.json' },
    { id: 'companions', title: 'Companions', subtitle: 'Sentinels', color: '#1dd1a1', link: '/companions', jsonFile: 'Sentinels.json' },
    { id: 'necramechs', title: 'Necramechs', subtitle: 'War Machines', color: '#a29bfe', link: '/necramechs', jsonFile: 'Warframes.json' }
];

function ApiImageCard({ cat }) {
    const [imgUrl, setImgUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchImage() {
            try {
                const res = await fetch(`${API_BASE_URL}/${cat.jsonFile}`);
                if (!res.ok) return;
                const data = await res.json();
                
                let targetItem;
                
                // Logica specifica per immagine anteprima
                if (cat.id === 'relics') {
                    targetItem = data.find(item => item.imageName && item.name.includes('Intact'));
                } else if (cat.id === 'necramech') {
                    targetItem = data.find(item => item.name.toLowerCase() === 'voidrig');
                } else {
                    targetItem = data.find(item => item.name.includes("Prime") && item.imageName);
                }
                
                const firstValid = targetItem || data.find(item => item.imageName && !item.imageName.includes("fanart"));
                
                if (firstValid && isMounted) {
                    setImgUrl(`${IMG_BASE_URL}/${firstValid.imageName}`);
                }
            } catch (e) { 
                console.error(`Img error ${cat.id}`, e);
            }
        }
        fetchImage();
        return () => { isMounted = false; };
    }, [cat.jsonFile, cat.id]);

    return (
        <Link href={cat.link} style={{textDecoration:'none'}}>
            <div 
                className="menu-card"
                style={{ '--card-color': cat.color, '--card-glow': `${cat.color}66` }}
            >
                <div className="card-visual-area">
                    {imgUrl ? (
                        <img src={imgUrl} alt={cat.title} className="card-img-element" />
                    ) : (
                        <div style={{background:'#151518', width:'100%', height:'100%'}}></div>
                    )}
                </div>
                
                <div className="card-content">
                    <h2 className="card-title">{cat.title}</h2>
                    <p className="card-sub">{cat.subtitle}</p>
                </div>
            </div>
        </Link>
    );
}

export default function LandingPage() {
    return (
        <main className="landing-page">
            <div className="landing-content">
                <div className="landing-header">
                    <h1 className="landing-title">ORDIS CODEX</h1>
                    <div className="landing-subtitle">Tracker & Database System</div>
                </div>

                <div className="cards-scroll-container">
                    <div className="cards-row">
                        {CATEGORIES.map((cat) => (
                            <ApiImageCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </div>
                
                <div className="landing-footer">
                    Operator Interface v2.1 // System Ready
                </div>
            </div>
        </main>
    );
}