"use client";
import { Suspense } from 'react';
import CodexListPage from '@/components/CodexListPage';

const MELEE_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Melee'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Melee' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') && !item.name.includes('Prisma')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Melee' && item.name.includes('Prime')
    }
];

export default function Page() {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Blades...</div>}>
            <CodexListPage 
                filesToLoad={['Melee.json']} 
                pageTitle="MELEE WEAPONS" 
                customCategories={MELEE_CATEGORIES}
            />
        </Suspense>
    );
}