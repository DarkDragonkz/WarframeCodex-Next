import { notFound } from 'next/navigation';
import { getMicroCategory } from '@/utils/categoryConfig';
import { fetchGameData } from '@/utils/serverData';

// Importiamo i componenti Client
import CodexListPage from '@/components/CodexListPage';
import ModsClientPage from '@/app/mods/ModsClientPage';
import RelicsClientPage from '@/app/relics/RelicsClientPage';

export default async function DynamicListPage({ params }) {
    const resolvedParams = await params;
    const microCat = getMicroCategory(resolvedParams.microCategory);

    if (!microCat) return notFound();

    // 1. Carica i dati
    let data = await fetchGameData(microCat.json);
    
    // 2. Filtra i dati lato server se necessario (Ottimizzazione)
    if (microCat.filter) {
        data = data.filter(microCat.filter);
    }

    // 3. Gestione Casi Speciali (Mods, Relics)
    if (microCat.specialPage === 'mods') {
        // Per le mod, potremmo aver bisogno anche di Arcanes se la categoria è mista, 
        // ma qui abbiamo diviso i JSON, quindi carichiamo solo quello giusto.
        return <ModsClientPage initialData={data} />;
    }

    if (microCat.specialPage === 'relics') {
        return <RelicsClientPage initialData={data} />;
    }

    // 4. Default: Pagina Lista Standard (Warframe, Armi, ecc.)
    // Carichiamo anche lookup per i Warframe (per sapere se sono vaulted)
    let lookup = null;
    if (microCat.id === 'warframes' || microCat.id === 'primary' || microCat.id === 'secondary' || microCat.id === 'melee') {
        lookup = await fetchGameData('RelicLookup.json');
    }

    return (
        <CodexListPage 
            initialData={data} 
            lookupData={lookup}
            pageTitle={microCat.title} 
            // Passiamo un ID categoria generico se serve per logiche interne, 
            // ma ora il filtraggio è già fatto lato server!
            categoryMode={null} 
        />
    );
}