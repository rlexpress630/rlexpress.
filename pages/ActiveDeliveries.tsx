import React, { useState, useEffect, useRef } from 'react';
import { useDelivery } from '../context/DeliveryContext';
import { DeliveryStatus, Delivery } from '../types';
import { Card, Button } from '../components/UIComponents';
import { MapPin, Navigation, MoreVertical, CheckCircle, Zap, Share2, XCircle, Route, Map, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActiveDeliveries = () => {
  const { deliveries, cancelDelivery, reorderPendingDeliveries } = useDelivery();
  const navigate = useNavigate();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeDeliveries = deliveries
    .filter(d => d.status === DeliveryStatus.PENDING);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCancel = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja cancelar a entrega para ${name}?`)) {
      cancelDelivery(id);
    }
    setOpenMenuId(null);
  };

  const handleOptimize = () => {
    if (activeDeliveries.length < 2) {
      alert("É preciso ter pelo menos 2 entregas para otimizar a rota.");
      return;
    }

    setIsOptimizing(true);
    
    // Use a timeout to give visual feedback
    setTimeout(() => {
      const deliveriesToSort = [...activeDeliveries];
      
      // Sort by CEP as a simple optimization heuristic
      deliveriesToSort.sort((a, b) => {
          const cepA = a.address.cep.replace(/\D/g, '');
          const cepB = b.address.cep.replace(/\D/g, '');
          return cepA.localeCompare(cepB);
      });

      // Update the state in the context to re-render the list in order
      reorderPendingDeliveries(deliveriesToSort);

      // Build and open the Google Maps URL with the newly sorted list
      const addresses = deliveriesToSort.map(d => encodeURIComponent(d.address.fullAddress));
      const mapsUrl = `https://www.google.com/maps/dir/${addresses.join('/')}`;
      
      window.open(mapsUrl, '_blank');
      
      setIsOptimizing(false);
      setIsOptimized(true);
    }, 1500);
  };

  const handleViewFullMap = () => {
    if (activeDeliveries.length === 0) {
      alert("Nenhuma entrega ativa para exibir no mapa.");
      return;
    }
    navigate('/map', { state: { deliveries: activeDeliveries } });
  };

  const handleShareRoute = async () => {
    if (activeDeliveries.length === 0) return;

    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    const header = `🚚 *ROTA DE ENTREGA - RL EXPRESS*\n📅 Data: ${dateStr}\n`;
    
    const body = activeDeliveries.map((d, i) => {
      const address = d.address.fullAddress.split(',')[0];
      const number = d.address.fullAddress.split(',')[1] || ''; 
      return `\n${i + 1}️⃣ *${d.customerName}*\n📍 ${address}${number ? `, ${number.trim()}` : ''}${d.address.city ? ` - ${d.address.city}` : ''}`;
    }).join('\n');

    const footer = `\n\n🏁 *Total:* ${activeDeliveries.length} paradas.`;
    const fullText = header + body + footer;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rota de Entrega RL Express', text: fullText });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') console.error(error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(fullText);
        alert("Rota copiada para a área de transferência!");
      } catch (err) {
        alert("Não foi possível compartilhar a rota.");
      }
    }
  };

  const openInMaps = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openOptimizedMultiStopRoute = (destinationDelivery: Delivery) => {
    if (activeDeliveries.length < 1) return;

    const destination = encodeURIComponent(destinationDelivery.address.fullAddress);

    const waypoints = activeDeliveries
      .filter(d => d.id !== destinationDelivery.id)
      .map(d => encodeURIComponent(d.address.fullAddress));
    
    const waypointsString = waypoints.join('|');
    
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    if (waypointsString) {
      mapsUrl += `&waypoints=${waypointsString}&dirflg=d&travelmode=driving`;
    }
    
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="p-6 pb-24 relative">
      {isOptimizing && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center">
             <Zap className="w-12 h-12 text-primary animate-pulse" />
             <h2 className="text-lg font-bold dark:text-white">Otimizando sua rota...</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Aguarde, estamos calculando o melhor percurso para suas entregas.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Rota Ativa</h1>
        <div className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full">
          {activeDeliveries.length} pendentes
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <Button 
            onClick={handleOptimize} 
            isLoading={isOptimizing}
            disabled={activeDeliveries.length < 2}
            className="flex-1 bg-black dark:bg-white dark:text-black text-white"
          >
            {isOptimized ? <RefreshCw className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" fill="currentColor" />}
            {isOptimized ? 'Recalcular Rota' : 'Otimizar Rota'}
          </Button>

          <Button 
              onClick={handleShareRoute}
              disabled={activeDeliveries.length === 0}
              variant="outline"
              className="w-14 px-0 flex items-center justify-center border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-white/10"
              title="Compartilhar Rota"
          >
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
        <Button 
            onClick={handleViewFullMap}
            disabled={activeDeliveries.length === 0}
            variant="outline"
            className="w-full"
        >
            <Map className="w-4 h-4 mr-2" />
            Visualizar Mapa Completo
        </Button>
      </div>

      <div className="space-y-4">
        {activeDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin className="w-16 h-16 mb-4 opacity-20" />
            <p>Nenhuma entrega na rota.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/add')}>
              Adicionar Entrega
            </Button>
          </div>
        ) : (
          activeDeliveries.map((delivery, index) => (
            <div key={delivery.id} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-0">
              <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-primary border-4 border-gray-50 dark:border-dark-bg z-10"></div>
              
              <Card className="mb-4 overflow-visible relative group hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">Parada {index + 1}</span>
                    <button onClick={() => openInMaps(delivery.address.fullAddress)} className="p-2 -mt-2 -mr-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Navigation className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{delivery.customerName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed border-b border-gray-50 dark:border-white/5 pb-3">
                    {delivery.address.fullAddress}
                    {delivery.address.city && <span className="block text-xs text-gray-400 mt-0.5">{delivery.address.city}</span>}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => navigate(`/proof/${delivery.id}`)}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmar Entrega
                    </button>
                    <button
                      onClick={() => openOptimizedMultiStopRoute(delivery)}
                      title="Visualizar rota otimizada"
                      className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <Route className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === delivery.id ? null : delivery.id)} 
                      className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {openMenuId === delivery.id && (
                  <div ref={menuRef} className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-dark-surface rounded-lg shadow-2xl border dark:border-dark-border z-30 py-1 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                      onClick={() => handleCancel(delivery.id, delivery.customerName)}
                      className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Entrega
                    </button>
                  </div>
                )}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveDeliveries;