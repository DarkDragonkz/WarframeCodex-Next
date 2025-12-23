"use client";
import { Suspense } from 'react';
import CodexListPage from '@/components/CodexListPage';

const PRIMARY_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Primary'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Primary' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') && !item.name.includes('Prisma')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Primary' && item.name.includes('Prime')
    }
];

export default function Page() {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Arsenal...</div>}>
            <CodexListPage 
                filesToLoad={['Primary.json']} 
                pageTitle="PRIMARY WEAPONS" 
                customCategories={PRIMARY_CATEGORIES}
            />
        </Suspense>
    );
}