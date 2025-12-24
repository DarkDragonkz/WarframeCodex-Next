"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { API_BASE_URL, IMG_BASE_URL } from '@/utils/constants';
import { HIERARCHY } from '@/utils/categoryConfig'; // Usiamo la nuova config
import './homepage.css';

function MacroCard({ cat }) {
    const [imgUrl, setImgUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchImage() {
            try {
                // Fetch del file JSON principale della macro categoria per trovare l'immagine di copertina
                const res = await fetch(`${API_BASE_URL}/${cat.jsonFile}`);
                if (!res.ok) return;
                const data = await res.json();
                
                // Cerca l'item di copertina specificato nella config o il primo valido
                const targetItem = data.find(item => item.name.includes(cat.coverItem)) || 
                                   data.find(item => item.imageName);
                
                if (targetItem && isMounted && targetItem.imageName) {
                    setImgUrl(`${IMG_BASE_URL}/${targetItem.imageName}`);
                }
            } catch (e) { 
                console.error(`Img error ${cat.id}`, e);
            }
        }
        fetchImage();
        return () => { isMounted = false; };
    }, [cat]);

    return (
        <Link href={`/${cat.id}`} style={{textDecoration:'none'}}>
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
                        {HIERARCHY.map((cat) => (
                            <MacroCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </div>
                
                <div className="landing-footer">
                    Operator Interface v3.0 // System Ready
                </div>
            </div>
        </main>
    );
}