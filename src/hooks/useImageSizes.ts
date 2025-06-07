import { useState } from 'react';

export function useImageSizes() {
  const [sizes, setSizes] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const getImageSize = async (url) => {
    // Evitar requests duplicados
    if (sizes[url] || loading[url]) return;

    setLoading(prev => ({ ...prev, [url]: true }));

    try {
      const response = await fetch(url, { method: 'HEAD' });

      const contentLength = response.headers.get('Content-Length');
      
      if (contentLength) {
        const bytes = parseInt(contentLength);
        const sizeData = {
          bytes,
          kb: Math.round(bytes / 1024 * 100) / 100,
          mb: Math.round(bytes / (1024 * 1024) * 100) / 100
        };
        
        setSizes(prev => ({ ...prev, [url]: sizeData }));
        setErrors(prev => ({ ...prev, [url]: null })); 
      } else {
        setErrors(prev => ({ ...prev, [url]: 'Tamaño no disponible' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, [url]: 'Error al obtener tamaño' }));
    } finally {
      setLoading(prev => ({ ...prev, [url]: false }));
    }
  };

  return { sizes, setSizes, loading, errors, getImageSize };
}