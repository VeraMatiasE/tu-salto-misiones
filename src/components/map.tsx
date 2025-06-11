import React, { useState } from 'react'
import { AlertCircle, MapPin } from 'lucide-react'

interface MapComponentProps {
  ubicacion: string
  urlMapa?: string
}

const MapComponent: React.FC<MapComponentProps> = ({ ubicacion, urlMapa }) => {
  const [mapError, setMapError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setMapError(true)
    setIsLoading(false)
    console.error('Error al cargar el mapa de Google Maps')
  }

  const isValidGoogleMapsUrl = (url: string) => {
    return url.includes('google.com/maps') || url.includes('maps.google.com')
  }

  const renderFallback = (errorType?: string) => (
    <div className="bg-gradient-to-br from-green-50 to-green-100 h-48 md:h-64 rounded-lg flex items-center justify-center border border-green-200">
      <div className="text-center p-4">
        {errorType === 'error' ? (
          <AlertCircle className="h-8 w-8 md:h-12 md:w-12 text-orange-500 mx-auto mb-2" />
        ) : (
          <MapPin className="h-8 w-8 md:h-12 md:w-12 text-red-500 mx-auto mb-2" />
        )}
        <p className="text-gray-700 font-medium mb-1">
          {errorType === 'error' ? 'Error al cargar el mapa' : 'Ubicación'}
        </p>
        <p className="text-sm md:text-base text-gray-600 mb-2">{ubicacion}</p>
        {errorType === 'error' && (
          <p className="text-xs text-gray-500">
            Verifica la URL del mapa o intenta más tarde
          </p>
        )}
      </div>
    </div>
  )

  if (!urlMapa || mapError) {
    return <div>{renderFallback(mapError ? 'error' : undefined)}</div>
  }

  if (!isValidGoogleMapsUrl(urlMapa)) {
    console.warn('La URL proporcionada no parece ser de Google Maps')
    return <div>{renderFallback('error')}</div>
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Cargando mapa...</p>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden shadow-md">
        <iframe
          src={urlMapa}
          width="100%"
          height="256"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg"
          title={`Mapa de ${ubicacion}`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  )
}

export default MapComponent
