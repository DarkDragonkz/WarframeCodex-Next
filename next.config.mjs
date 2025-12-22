/** @type {import('next').NextConfig} */

// 1. INSERISCI QUI IL NOME ESATTO DELLA TUA REPO SU GITHUB
const repoName = 'warframecodex-next'; 

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Fondamentale: dice a Next.js di creare file HTML statici
  output: 'export',
  
  // Gestione dei percorsi per GitHub Pages
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',

  // Disabilita l'ottimizzazione immagini server-side (non funziona su Pages)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;