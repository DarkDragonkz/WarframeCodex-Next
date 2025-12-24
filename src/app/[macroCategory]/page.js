import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMacroCategory } from '@/utils/categoryConfig';
import { fetchGameData } from '@/utils/serverData';
import { IMG_BASE_URL } from '@/utils/constants';
import '@/app/homepage.css'; // Riutilizziamo lo stile delle card

// Questa pagina è Server Component, quindi può fare fetch diretti
export default async function MacroCategoryPage({ params }) {
    // Await params in Next.js 15+
    const resolvedParams = await params;
    const category = getMacroCategory(resolvedParams.macroCategory);

    if (!category) return notFound();

    return (
        <main className="landing-page">
            <div className="landing-content">
                <div className="landing-header">
                    <Link href="/" style={{textDecoration:'none', color:'#666', fontSize:'12px', marginBottom:'10px', display:'block'}}>
                        &larr; BACK TO HUB
                    </Link>
                    <h1 className="landing-title" style={{color: category.color}}>
                        {category.title}
                    </h1>
                    <div className="landing-subtitle">{category.subtitle}</div>
                </div>

                <div className="cards-scroll-container">
                    <div className="cards-row">
                        {category.items.map((micro) => (
                            <MicroCard key={micro.id} micro={micro} color={category.color} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

// Componente Card per le Micro Categorie (recupera immagine server-side se possibile)
async function MicroCard({ micro, color }) {
    // Cerchiamo un'immagine rappresentativa
    const data = await fetchGameData(micro.json);
    // Troviamo il primo item valido che rispetta il filtro della micro-categoria
    const targetItem = data.find(i => 
        (micro.filter ? micro.filter(i) : true) && 
        i.imageName && 
        !i.imageName.includes("fanart")
    );
    
    const imgUrl = targetItem ? `${IMG_BASE_URL}/${targetItem.imageName}` : null;

    return (
        <Link href={`/list/${micro.id}`} style={{textDecoration:'none'}}>
            <div 
                className="menu-card"
                style={{ '--card-color': color, '--card-glow': `${color}66`, width: '180px', height: '260px' }}
            >
                <div className="card-visual-area">
                    {imgUrl ? (
                        <img src={imgUrl} alt={micro.title} className="card-img-element" />
                    ) : (
                        <div style={{background:'#222', width:'100%', height:'100%'}}></div>
                    )}
                </div>
                
                <div className="card-content">
                    <h2 className="card-title" style={{fontSize:'18px'}}>{micro.title}</h2>
                    <p className="card-sub">BROWSE COLLECTION</p>
                </div>
            </div>
        </Link>
    );
}