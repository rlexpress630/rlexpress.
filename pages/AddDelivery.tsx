import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, ScanLine, Sparkles, Trash2, Plus, Image as ImageIcon, FileText, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Card } from '../components/UIComponents';
import { useDelivery } from '../context/DeliveryContext';
import { extractDeliveryDetails } from '../services/geminiService';
import { fetchAddressByCep } from '../services/cepService';
import { DeliveryStatus } from '../types';

interface ScannedItem {
  tempId: string;
  imagePreview: string;
  isLoading: boolean;
  isCepLoading?: boolean;
  error?: string;
  data: {
    name: string;
    phone: string;
    address: string;
    cep: string;
    city: string;
    complement: string;
    lat?: number;
    lng?: number;
  };
}

const DRAFT_KEY = 'rl_delivery_drafts';

const AddDelivery = () => {
  const navigate = useNavigate();
  const { addDelivery } = useDelivery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  // Derived state for UI feedback
  const processingCount = items.filter(i => i.isLoading).length;
  const hasItems = items.length > 0;

  // 1. Check for drafts on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShowDraftPrompt(true);
        }
      } catch (e) {
        console.error("Error parsing draft", e);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // 2. Auto-save logic
  useEffect(() => {
    if (showDraftPrompt) return;

    if (items.length > 0) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn("LocalStorage limit exceeded, draft not saved.", e);
      }
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [items, showDraftPrompt]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleResumeDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsedItems = JSON.parse(savedDraft);
        setItems(parsedItems);
        // Expand errors or empty names by default
        const idsToExpand = new Set<string>();
        parsedItems.forEach((i: ScannedItem) => {
             if(!i.data.name || i.error) idsToExpand.add(i.tempId);
        });
        setExpandedIds(idsToExpand);
      }
    } catch (e) {
      console.error(e);
    }
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftPrompt(false);
    setItems([]);
  };

  const processFile = async (file: File): Promise<ScannedItem> => {
    const tempId = crypto.randomUUID();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          tempId,
          imagePreview: reader.result as string,
          isLoading: true,
          data: { name: '', phone: '', address: '', cep: '', city: '', complement: '' }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 1. Convert files to items
    const fileArray = Array.from(files);
    const newItems = await Promise.all(fileArray.map(processFile));
    
    // Add to state immediately
    setItems(prev => [...prev, ...newItems]);
    
    // Auto expand new items
    setExpandedIds(prev => {
      const next = new Set(prev);
      newItems.forEach(i => next.add(i.tempId));
      return next;
    });

    // Reset input to allow adding same files again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';

    // 2. Process OCR Sequentially to respect Rate Limits
    for (const item of newItems) {
      try {
        const details = await extractDeliveryDetails(item.imagePreview);
        setItems(prev => prev.map(i => i.tempId === item.tempId ? {
          ...i,
          isLoading: false,
          data: {
            name: details.customerName || '',
            phone: details.phone || '',
            address: details.fullAddress || '',
            cep: details.cep || '',
            city: details.city || '',
            complement: details.complement || '',
            lat: details.lat,
            lng: details.lng
          }
        } : i));
      } catch (error) {
        console.error("Item processing error:", error);
        setItems(prev => prev.map(i => i.tempId === item.tempId ? {
          ...i,
          isLoading: false,
          error: 'Falha na leitura (Tente manual).'
        } : i));
      }
      // Small delay between successful requests to be safe
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const updateItemData = (id: string, field: string, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.tempId === id ? { ...item, data: { ...item.data, [field]: value } } : item
    ));
  };

  const maskCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };
  
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15); // (DD) XXXXX-XXXX
  };

  const handleCepBlur = async (id: string, cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    // Set loading state for this item
    setItems(prev => prev.map(i => i.tempId === id ? { ...i, isCepLoading: true } : i));

    const addressData = await fetchAddressByCep(cleanCep);

    // Update item with address data or just stop loading
    setItems(prev => prev.map(i => {
      if (i.tempId !== id) return i;
      
      if (addressData) {
        return {
          ...i,
          isCepLoading: false,
          data: {
            ...i.data,
            address: addressData.logradouro,
            city: `${addressData.localidade}/${addressData.uf}`,
            // We preserve other fields like name/number if they were already there
          }
        };
      }
      return { ...i, isCepLoading: false };
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.tempId !== id));
    setExpandedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
  };

  const handleSaveAll = () => {
    if (processingCount > 0) return;

    const validItems = items.filter(i => i.data.name && i.data.address);
    const invalidCount = items.length - validItems.length;

    if (validItems.length === 0) {
      alert("Nenhum item válido para salvar. Preencha Nome e Endereço.");
      return;
    }

    if (invalidCount > 0) {
      const confirm = window.confirm(`Existem ${invalidCount} entregas incompletas (sem Nome ou Endereço). Deseja salvar apenas as ${validItems.length} válidas e descartar o resto?`);
      if (!confirm) return;
    }

    validItems.forEach(item => {
      addDelivery({
        id: crypto.randomUUID(),
        customerName: item.data.name,
        phone: item.data.phone,
        address: {
          fullAddress: item.data.address,
          cep: item.data.cep,
          city: item.data.city,
          notes: item.data.complement,
          lat: item.data.lat,
          lng: item.data.lng,
        },
        status: DeliveryStatus.PENDING,
        createdAt: Date.now()
      });
    });

    localStorage.removeItem(DRAFT_KEY);
    navigate('/active');
  };

  // --- Render Helpers ---

  const DraftPrompt = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold dark:text-white mb-2">Rascunho Encontrado</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Existem entregas não salvas de uma sessão anterior.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={handleResumeDraft} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" /> Continuar Editando
          </Button>
          <Button onClick={handleDiscardDraft} variant="outline" className="w-full text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" /> Descartar
          </Button>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-48 h-48 bg-white dark:bg-dark-surface rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-dark-border shadow-lg hover:scale-105 transition-all"
        >
          <div className="relative">
            <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2 absolute -left-4 top-0" />
            <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2 absolute left-4 top-2 -z-10" />
          </div>
          <div className="mt-14 text-center">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Adicionar Fotos</span>
            <span className="text-xs text-gray-400 block mt-1">Galeria ou Câmera</span>
          </div>
          <span className="text-xs text-primary mt-3 flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> Leitura em Lote
          </span>
        </button>
      </div>

      <div className="w-full max-w-xs text-center">
        <Button 
          variant="outline" 
          className="w-full mt-6"
          onClick={() => {
            const newItem: ScannedItem = {
              tempId: crypto.randomUUID(),
              imagePreview: '',
              isLoading: false,
              data: { name: '', phone: '', address: '', cep: '', city: '', complement: '' }
            };
            setItems([newItem]);
            setExpandedIds(new Set([newItem.tempId]));
          }}
        >
          Entrada Manual
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-bold dark:text-white">
          {hasItems ? `${items.length} Entregas` : 'Nova Entrega'}
        </h1>
        {hasItems && !showDraftPrompt ? (
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10"></div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple 
        onChange={handleFiles}
      />

      {showDraftPrompt ? (
        <DraftPrompt />
      ) : !hasItems ? (
        <EmptyState />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Status Bar for Batch Processing */}
          {processingCount > 0 && (
             <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg mb-3 flex items-center justify-between text-xs font-medium animate-in slide-in-from-top-2">
                <span className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Processando {processingCount} imagens com IA...
                </span>
             </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
            {items.map((item, index) => {
              const isExpanded = expandedIds.has(item.tempId);
              
              return (
              <Card 
                key={item.tempId} 
                className={`relative animate-in slide-in-from-bottom-4 duration-500 fill-mode-backwards p-0 overflow-hidden ${item.error ? 'border-red-200 dark:border-red-900/50' : ''}`} 
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header / Summary (Clickable) */}
                <div 
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-white/5' : ''}`}
                  onClick={() => toggleExpand(item.tempId)}
                >
                    {/* Tiny Thumbnail */}
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 dark:bg-black/20 overflow-hidden relative border border-gray-200 dark:border-dark-border">
                        {item.imagePreview ? (
                            <img src={item.imagePreview} className="w-full h-full object-cover" alt="Scan" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ScanLine className="w-6 h-6" />
                            </div>
                        )}
                        {item.isLoading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white backdrop-blur-sm">
                                <ScanLine className="w-4 h-4 animate-pulse" />
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                             <h3 className={`text-sm font-bold truncate ${!item.data.name ? 'text-gray-400 italic' : 'text-gray-900 dark:text-white'}`}>
                                 {item.isLoading ? "Processando..." : (item.data.name || "Nova Entrega")}
                             </h3>
                             {item.error && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.data.address || "Toque para editar"}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                         <button 
                           onClick={(e) => { e.stopPropagation(); removeItem(item.tempId); }}
                           className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                         <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5" />
                         </div>
                    </div>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                    <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface animate-in slide-in-from-top-2 duration-200">
                        <Input 
                        label="Nome" 
                        value={item.data.name} 
                        onChange={(e) => updateItemData(item.tempId, 'name', e.target.value)}
                        placeholder="Nome do Cliente"
                        className={`!py-2 !text-sm !mb-0 ${!item.data.name && !item.isLoading ? 'border-red-300 dark:border-red-800' : ''}`}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label={item.isCepLoading ? "Buscando..." : "CEP"}
                                value={item.data.cep}
                                onChange={(e) => {
                                    const val = maskCep(e.target.value);
                                    updateItemData(item.tempId, 'cep', val);
                                }}
                                onBlur={() => handleCepBlur(item.tempId, item.data.cep)}
                                placeholder="00000-000"
                                maxLength={9}
                                className={`!py-2 !text-sm !mb-0 ${item.isCepLoading ? 'opacity-50' : ''}`}
                            />
                            <Input
                                label="Telefone"
                                value={item.data.phone}
                                onChange={(e) => updateItemData(item.tempId, 'phone', maskPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                className="!py-2 !text-sm !mb-0"
                            />
                        </div>

                        <Input 
                        label="Endereço" 
                        value={item.data.address} 
                        onChange={(e) => updateItemData(item.tempId, 'address', e.target.value)}
                        placeholder="Logradouro"
                        className={`!py-2 !text-sm !mb-0 ${!item.data.address && !item.isLoading ? 'border-red-300 dark:border-red-800' : ''}`}
                        />

                        <div className="grid grid-cols-2 gap-3">
                        <Input 
                            label="Número/Comp" 
                            value={item.data.complement} 
                            onChange={(e) => updateItemData(item.tempId, 'complement', e.target.value)}
                            placeholder="Nº ou Apto"
                            className="!py-2 !text-sm !mb-0"
                        />
                        <Input 
                            label="Cidade/UF" 
                            value={item.data.city} 
                            onChange={(e) => updateItemData(item.tempId, 'city', e.target.value)}
                            placeholder="Cidade - UF"
                            className="!py-2 !text-sm !mb-0"
                        />
                        </div>
                        
                        {item.error && (
                            <div className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                {item.error}
                            </div>
                        )}
                    </div>
                )}
              </Card>
            )})}
          </div>

          <div className="pt-4 mt-auto bg-gray-50 dark:bg-dark-bg z-10 transition-all duration-300 space-y-3">
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar mais fotos
            </Button>
            <Button 
              onClick={handleSaveAll} 
              className="w-full bg-primary text-white shadow-xl"
              disabled={processingCount > 0}
            >
              {processingCount > 0 ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Aguarde o processamento...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" /> 
                  Confirmar e Salvar {items.length} Entregas
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDelivery;