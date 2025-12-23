"use client";
import { Suspense } from 'react';
import CodexListPage from '@/components/CodexListPage';

const COMPANION_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Sentinels' // O 'Pets' se il file li include
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Sentinels' && !item.name.includes('Prime')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Sentinels' && item.name.includes('Prime')
    }
];

export default function Page() {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Sentinels...</div>}>
            <CodexListPage 
                filesToLoad={['Sentinels.json']} 
                pageTitle="COMPANIONS" 
                customCategories={COMPANION_CATEGORIES}
            />
        </Suspense>
    );
}