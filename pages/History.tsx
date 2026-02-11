import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDelivery } from '../context/DeliveryContext';
import { DeliveryStatus, Delivery } from '../types';
import { Card, Badge, Input, Button } from '../components/UIComponents';
import { Search, Calendar, User, Download, Share2, FileText, PenTool, CheckCircle, X, List, XCircle, MoreVertical } from 'lucide-react';

// New component for the printable receipt
const PrintableProof: React.FC<{ delivery: Delivery }> = ({ delivery }) => {
  const formatDate = (ts?: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  };

  return (
    <div id="printable-receipt" className="p-4 font-sans text-black bg-white">
      <header className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">
            RL <span style={{ color: '#DC2626' }}>EXPRESS</span>
          </h1>
          <p className="text-lg font-semibold">Comprovante de Entrega</p>
        </div>
        <p className="text-sm">ID: {delivery.id.substring(0, 8)}</p>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Detalhes da Entrega</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <p className="text-xs text-gray-600 uppercase font-bold">Cliente</p>
            <p className="text-base">{delivery.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-bold">Data & Hora</p>
            <p className="text-base">{formatDate(delivery.completedAt)}</p>
          </div>
          <div className="col-span-2 mt-2">
            <p className="text-xs text-gray-600 uppercase font-bold">Endereço</p>
            <p className="text-base">{delivery.address.fullAddress}</p>
            {delivery.address.city && <p className="text-sm text-gray-700">{delivery.address.city}</p>}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">Comprovação</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="col-span-2">
            <p className="text-xs text-gray-600 uppercase font-bold">Recebido por</p>
            <p className="text-base">{delivery.proof?.receiverName || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-bold">Vínculo com o destinatário</p>
            <p className="text-base">{delivery.proof?.receiverRelationship || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-bold">Documento</p>
            <p className="text-base">{delivery.proof?.receiverDoc || 'N/A'}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Foto do Comprovante</h3>
          {delivery.proof?.photoUrl ? (
            <img src={delivery.proof.photoUrl} alt="Proof" className="w-full rounded-lg border-2 border-gray-200" />
          ) : (
            <p className="text-gray-500">Nenhuma foto disponível.</p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Assinatura</h3>
          {delivery.proof?.signatureUrl ? (
            <div className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50 flex items-center justify-center h-full">
              <img src={delivery.proof.signatureUrl} alt="Signature" className="max-h-24" />
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma assinatura digital coletada.</p>
          )}
        </div>
      </section>
      
      {delivery.proof?.notes && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Observações</h3>
          <p className="border border-gray-200 p-3 rounded-lg bg-gray-50 italic">"{delivery.proof.notes}"</p>
        </section>
      )}

      <footer className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        Gerado por RL EXPRESS em {new Date().toLocaleString('pt-BR')}
      </footer>
    </div>
  );
};


const History = () => {
  const { deliveries } = useDelivery();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [successModalDelivery, setSuccessModalDelivery] = useState<Delivery | null>(null);
  const [printingDelivery, setPrintingDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState<DeliveryStatus>(DeliveryStatus.COMPLETED);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const deliveriesByStatus = deliveries
    .filter(d => d.status === activeTab)
    .sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));

  const filtered = deliveriesByStatus.filter(d => 
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.address.fullAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (location.state?.newDeliveryId) {
      const newDelivery = deliveries.find(d => d.id === location.state.newDeliveryId);
      if (newDelivery) {
        setActiveTab(DeliveryStatus.COMPLETED);
        setSuccessModalDelivery(newDelivery);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, deliveries]);

  useEffect(() => {
    if (!printingDelivery) return;

    const timer = setTimeout(() => window.print(), 100);

    const handleAfterPrint = () => {
      setPrintingDelivery(null);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printingDelivery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (ts?: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };
  
  const handlePrintProof = (delivery: Delivery) => {
    setPrintingDelivery(delivery);
  };

  const handleShare = async (delivery: Delivery) => {
    if (!navigator.share) {
      alert("Seu navegador não suporta a funcionalidade de compartilhamento nativo.");
      return;
    }

    const dateStr = formatDate(delivery.completedAt);
    
    const textData = `
📦 *COMPROVANTE DE ENTREGA*
--------------------------------
👤 *Cliente:* ${delivery.customerName}
📍 *Endereço:* ${delivery.address.fullAddress}
📅 *Data:* ${dateStr}
--------------------------------
📝 *Recebido por:* ${delivery.proof?.receiverName || 'Não informado'}
🤝 *Vínculo:* ${delivery.proof?.receiverRelationship || 'N/A'}
🆔 *Documento:* ${delivery.proof?.receiverDoc || 'N/A'}
✍️ *Assinado:* ${delivery.proof?.signatureUrl ? 'Sim' : 'Não'}
💬 *Observações:* ${delivery.proof?.notes || '-'}
`.trim();

    const shareData: any = { 
      title: `Entrega - ${delivery.customerName}`,
      text: textData,
    };

    const files: File[] = [];

    if (delivery.proof?.photoUrl) {
      try {
        const response = await fetch(delivery.proof.photoUrl);
        const blob = await response.blob();
        files.push(new File([blob], `comprovante_${delivery.id.substring(0, 4)}.jpg`, { type: 'image/jpeg' }));
      } catch (e) {
        console.warn("Erro ao processar foto para compartilhamento", e);
      }
    }
    
    if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
        shareData.files = files;
    }

    try {
      await navigator.share(shareData);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Erro no compartilhamento:", error);
      }
    }
  };

  const handleDownloadProof = (delivery: Delivery) => {
    if (!delivery.proof?.photoUrl) return;
    
    const link = document.createElement('a');
    link.href = delivery.proof.photoUrl;
    const safeName = delivery.customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `comprovante_${safeName}_${delivery.id.slice(0, 4)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareAll = async () => {
    const statusLabel = activeTab === DeliveryStatus.COMPLETED ? 'CONCLUÍDAS' : 'CANCELADAS';
    if (filtered.length === 0) {
      alert(`Não há entregas ${statusLabel.toLowerCase()} para compartilhar.`);
      return;
    }

    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    const header = `📋 *RELATÓRIO DE ENTREGAS ${statusLabel}* - RL EXPRESS\n📅 Data: ${dateStr}\n`;

    const body = filtered.map((d, i) => {
      const deliveryDate = formatDate(d.completedAt || d.createdAt);
      let proofDetails = '';
      if (activeTab === DeliveryStatus.COMPLETED && d.proof) {
        proofDetails += `\nRecebido por: ${d.proof.receiverName || 'N/A'}`;
        if (d.proof.receiverRelationship) {
          proofDetails += ` (${d.proof.receiverRelationship})`;
        }
        if (d.proof.receiverDoc) {
          proofDetails += `\nDocumento: ${d.proof.receiverDoc}`;
        }
      }
      return `\n*${i + 1}. ${d.customerName}* (${deliveryDate})${proofDetails}`;
    }).join('\n');


    const footer = `\n\n🏁 *Total:* ${filtered.length} entregas.`;
    const fullText = header + body + footer;

    if (navigator.share) {
      try {
        await navigator.share({ 
            title: `Relatório de Entregas ${statusLabel}`, 
            text: fullText 
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') console.error(error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(fullText);
        alert("Relatório copiado para a área de transferência!");
      } catch (err) {
        alert("Não foi possível compartilhar o relatório.");
      }
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return alert(`Não há entregas ${activeTab === DeliveryStatus.COMPLETED ? 'concluídas' : 'canceladas'} para exportar.`);

    const headers = ["ID", "Cliente", "Endereço", "Data/Hora", "Status", "Recebedor", "Documento", "Observações", "Assinado"];
    const csvContent = [
      headers.join(","),
      ...filtered.map(d => [
        d.id,
        `"${d.customerName}"`,
        `"${d.address.fullAddress}"`,
        new Date(d.completedAt || d.createdAt).toLocaleString('pt-BR'),
        d.status,
        `"${d.proof?.receiverName || ''}"`,
        `"${d.proof?.receiverDoc || ''}"`,
        `"${d.proof?.notes || ''}"`,
        d.proof?.signatureUrl ? "Sim" : "Não"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_entregas_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TabButton: React.FC<{ status: DeliveryStatus, label: string, icon: React.ElementType }> = ({ status, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(status)}
      className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg transition-all ${
        activeTab === status
          ? 'bg-primary text-white shadow-md'
          : 'bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="p-6 pb-24 relative">
      {printingDelivery && <PrintableProof delivery={printingDelivery} />}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold dark:text-white">Histórico</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShareAll}
            className="p-2 text-gray-500 hover:text-primary transition-colors"
            title="Compartilhar Relatório"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="p-2 text-gray-500 hover:text-primary transition-colors"
            title="Exportar Relatório CSV"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="flex gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-xl mb-4">
        <TabButton status={DeliveryStatus.COMPLETED} label="Concluídas" icon={CheckCircle} />
        <TabButton status={DeliveryStatus.CANCELED} label="Canceladas" icon={XCircle} />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Buscar por nome ou endereço..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-primary outline-none dark:text-white"
        />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
             {activeTab === DeliveryStatus.COMPLETED ? 'Nenhuma entrega concluída.' : 'Nenhuma entrega cancelada.'}
          </div>
        ) : (
          filtered.map(delivery => (
            <Card key={delivery.id} className="group relative">
              <div className="flex justify-between items-start mb-3">
                <Badge status={delivery.status} />
                <span className="text-xs text-gray-400 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(delivery.completedAt || delivery.createdAt)}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{delivery.customerName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{delivery.address.fullAddress}</p>
              
              {delivery.proof && delivery.status === DeliveryStatus.COMPLETED && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start flex-1">
                      {delivery.proof.photoUrl ? (
                        <img 
                          src={delivery.proof.photoUrl} 
                          alt="Proof" 
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600 shrink-0" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="overflow-hidden space-y-2">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Recebido por</p>
                          <div className="flex items-center text-sm font-medium dark:text-gray-200 truncate">
                            <User className="w-3 h-3 mr-1" />
                            {delivery.proof.receiverName}
                          </div>
                          {delivery.proof.receiverRelationship && (
                            <span className="text-xs text-gray-400 block mt-0.5">Vínculo: {delivery.proof.receiverRelationship}</span>
                          )}
                          {delivery.proof.receiverDoc && (
                            <span className="text-xs text-gray-400 block mt-0.5">Doc: {delivery.proof.receiverDoc}</span>
                          )}
                        </div>

                        {delivery.proof.signatureUrl && (
                          <div className="mt-2">
                             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center">
                               <PenTool className="w-3 h-3 mr-1" /> Assinatura
                             </p>
                             <div className="bg-white p-1 rounded border border-gray-200 inline-block">
                               <img src={delivery.proof.signatureUrl} alt="Assinatura" className="h-8 max-w-[120px] object-contain" />
                             </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === delivery.id ? null : delivery.id)}
                        className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-95"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === delivery.id && (
                        <div ref={menuRef} className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-dark-surface rounded-lg shadow-2xl border dark:border-dark-border z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => { handleShare(delivery); setOpenMenuId(null); }}
                            className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            <Share2 className="w-4 h-4 mr-3" />
                            Compartilhar Resumo
                          </button>
                          <button
                            onClick={() => { handlePrintProof(delivery); setOpenMenuId(null); }}
                            className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            <FileText className="w-4 h-4 mr-3" />
                            Salvar Recibo (PDF)
                          </button>
                          {delivery.proof.photoUrl && (
                            <button
                              onClick={() => { handleDownloadProof(delivery); setOpenMenuId(null); }}
                              className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              <Download className="w-4 h-4 mr-3" />
                              Baixar Foto
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                  {delivery.proof.notes && (
                     <p className="text-xs text-gray-500 mt-3 italic bg-gray-50 dark:bg-black/20 p-2 rounded">
                       "{delivery.proof.notes}"
                     </p>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {successModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-dark-border text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">Entrega Registrada!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Os dados de {successModalDelivery.customerName} foram salvos com sucesso.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => handleShare(successModalDelivery)}
                className="w-full bg-green-600 hover:bg-green-700 shadow-green-500/30"
              >
                 <Share2 className="w-5 h-5 mr-2" />
                 Compartilhar Comprovante
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSuccessModalDelivery(null)}
                className="w-full border-gray-200 dark:border-gray-700"
              >
                <X className="w-5 h-5 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;