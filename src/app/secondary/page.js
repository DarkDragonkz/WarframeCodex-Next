"use client";
import { Suspense } from 'react';
import CodexListPage from '@/components/CodexListPage';

const SECONDARY_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Secondary'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Secondary' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') && !item.name.includes('Prisma')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Secondary' && item.name.includes('Prime')
    }
];

export default function Page() {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Sidearms...</div>}>
            <CodexListPage 
                filesToLoad={['Secondary.json']} 
                pageTitle="SECONDARY WEAPONS" 
                customCategories={SECONDARY_CATEGORIES}
            />
        </Suspense>
    );
}