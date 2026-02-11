import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Delivery } from '../types';
import { ArrowLeft, Navigation } from 'lucide-react';

// Fix for default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to automatically fit the map to the markers
const FitBounds = ({ markers }: { markers: [number, number][] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (markers.length > 0) {
      map.fitBounds(markers, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
};

const FullMapView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const deliveries: Delivery[] = location.state?.deliveries || [];

  const markers = useMemo(() => {
    return deliveries
      .filter(d => d.address.lat != null && d.address.lng != null)
      .map(d => ({
        position: [d.address.lat!, d.address.lng!] as [number, number],
        customerName: d.customerName,
        fullAddress: d.address.fullAddress
      }));
  }, [deliveries]);
  
  const markerPositions = markers.map(m => m.position);
  const deliveriesWithoutCoords = deliveries.length - markers.length;

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-[1000] bg-gradient-to-b from-black/50 to-transparent">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/80 dark:bg-dark-surface/80 rounded-full shadow-lg backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
        <div className="bg-white/80 dark:bg-dark-surface/80 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm">
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">{markers.length} Paradas no Mapa</h1>
        </div>
      </div>
      
      {deliveriesWithoutCoords > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg text-xs font-medium shadow-lg text-center">
          Aviso: {deliveriesWithoutCoords} entrega(s) não possuem coordenadas e não estão sendo exibidas.
        </div>
      )}

      {markers.length > 0 ? (
        <MapContainer center={markerPositions[0]} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker, index) => (
            <Marker key={index} position={marker.position}>
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-base mb-1">{marker.customerName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{marker.fullAddress}</p>
                  <button 
                    onClick={() => openInGoogleMaps(marker.position[0], marker.position[1])}
                    className="w-full text-left text-blue-600 font-semibold text-sm flex items-center gap-1"
                  >
                     <Navigation size={14} /> Abrir no Google Maps
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds markers={markerPositions} />
        </MapContainer>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h2 className="text-xl font-bold dark:text-white">Nenhum Ponto para Exibir</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Nenhuma das entregas ativas possui coordenadas geográficas para serem exibidas no mapa.
          </p>
        </div>
      )}
    </div>
  );
};

export default FullMapView;