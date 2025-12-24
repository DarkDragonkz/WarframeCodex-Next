import { fetchGameData } from '@/utils/serverData';
import RelicsClientPage from './RelicsClientPage';

export default async function Page() {
    // Carichiamo i dati lato server
    const data = await fetchGameData('Relics.json');

    return (
        <RelicsClientPage initialData={data} />
    );
}