export const getBasePath = (path) => {
    // Rimuove lo slash iniziale se presente per evitare doppi slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // In produzione (GitHub Pages), aggiunge il nome della repo
    // IMPORTANTE: Se la tua repo si chiama diversamente, cambia 'warframecodex-next' qui sotto
    if (process.env.NODE_ENV === 'production') {
        return `/warframecodex-next/${cleanPath}`;
    }
    
    // In locale ritorna il path normale
    return `/${cleanPath}`;
};