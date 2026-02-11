import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDelivery } from '../context/DeliveryContext';
import { Button, Input, Card, Textarea } from '../components/UIComponents';
import { Camera, Save, ArrowLeft, PenTool, Eraser, CheckCircle, AlertTriangle, Maximize, X, ZoomIn, ZoomOut, Check, Image as ImageIcon } from 'lucide-react';

const ProofOfDelivery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deliveries, completeDelivery, isDarkMode } = useDelivery();
  const delivery = deliveries.find(d => d.id === id);
  
  // Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Signature Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasSignature = useRef(false);

  // Component State
  const [receiverName, setReceiverName] = useState('');
  const [receiverDoc, setReceiverDoc] = useState('');
  const [receiverRelationship, setReceiverRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(false);
  const [isSignatureFullscreen, setIsSignatureFullscreen] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // Zoom Modal State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = isDarkMode ? '#FAFAFA' : '#18181b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isDarkMode]);

  // Handle body scroll when fullscreen signature is active
  useEffect(() => {
    if (isSignatureFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isSignatureFullscreen]);
  
  // Initialize Fullscreen Canvas
  useEffect(() => {
    if (!isSignatureFullscreen) return;

    const fsCanvas = fullscreenCanvasRef.current;
    if (fsCanvas) {
      // Set dimensions
      const padding = 32;
      fsCanvas.width = window.innerWidth - padding;
      fsCanvas.height = window.innerHeight * 0.6;
      
      const ctx = fsCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isDarkMode ? '#18181b' : '#ffffff';
        ctx.fillRect(0, 0, fsCanvas.width, fsCanvas.height);
        ctx.strokeStyle = isDarkMode ? '#FAFAFA' : '#18181b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Copy existing signature to fullscreen canvas
        if (hasSignature.current && canvasRef.current) {
           ctx.drawImage(canvasRef.current, 0, 0, fsCanvas.width, fsCanvas.height);
        }
      }
    }
  }, [isSignatureFullscreen, isDarkMode]);

  // --- Signature Logic ---
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent, targetCanvas: HTMLCanvasElement | null) => {
    if (!targetCanvas) return;
    if (e.cancelable) e.preventDefault();
    if (targetCanvas === canvasRef.current) setIsCanvasActive(true);

    isDrawing.current = true;
    const { x, y } = getCoordinates(e, targetCanvas);
    
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, targetCanvas: HTMLCanvasElement | null) => {
    if (!isDrawing.current || !targetCanvas) return;
    if (e.cancelable) e.preventDefault();
    
    const { x, y } = getCoordinates(e, targetCanvas);
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      if(targetCanvas === canvasRef.current) hasSignature.current = true;
    }
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    setIsCanvasActive(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSignature.current = false;
    }
  };
  
  const clearFullscreenSignature = () => {
    const canvas = fullscreenCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = isDarkMode ? '#18181b' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const confirmFullscreenSignature = () => {
    const fsCanvas = fullscreenCanvasRef.current;
    const mainCanvas = canvasRef.current;
    if (!fsCanvas || !mainCanvas) return;

    const mainCtx = mainCanvas.getContext('2d');
    const fsCtx = fsCanvas.getContext('2d');
    if (!mainCtx || !fsCtx) return;

    // Check if fullscreen canvas is empty by analyzing pixel data
    const imageData = fsCtx.getImageData(0, 0, fsCanvas.width, fsCanvas.height);
    const data = imageData.data;
    let isEmpty = true;
    const bgColor = isDarkMode ? { r: 24, g: 24, b: 27 } : { r: 255, g: 255, b: 255 };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // If a pixel has some opacity and is not the pure background color, the canvas is not empty.
      // This handles anti-aliasing near the background color.
      if (a > 10 && (r !== bgColor.r || g !== bgColor.g || b !== bgColor.b)) {
        isEmpty = false;
        break;
      }
    }

    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    if (!isEmpty) {
        mainCtx.drawImage(fsCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
        hasSignature.current = true;
    } else {
        hasSignature.current = false;
    }
    
    setIsSignatureFullscreen(false);
  };

  const handleReceiverNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setReceiverName(newName);
  
    if (delivery && newName.trim().toLowerCase() === delivery.customerName.trim().toLowerCase()) {
      setReceiverRelationship('Titular');
    } else if (receiverRelationship === 'Titular') {
      setReceiverRelationship('');
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
    }
  };

  // --- Zoom Logic ---
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.5, 1));
  const closeZoomModal = () => {
    setIsZoomOpen(false);
    setZoomScale(1);
  };

  if (!delivery) return <div className="p-6 text-center">Entrega não encontrada.</div>;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIMENSION = 1280; // Max width or height
            let { width, height } = img;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height = Math.round(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width = Math.round(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            const result = event.target?.result;
            if (!ctx || typeof result !== 'string') {
                if (typeof result === 'string') setPhoto(result);
                return;
            };
            
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85); 
            setPhoto(dataUrl);
        };
        const result = event.target?.result;
        if (typeof result === 'string') {
          img.src = result;
        }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAttempt(true);

    if (!receiverName || !photo) {
      if (!photo) {
        document.getElementById('photo-uploader')?.focus();
      } else if (!receiverName) {
        document.querySelector<HTMLInputElement>('input[name="receiverName"]')?.focus();
      }
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    let signatureUrl = undefined;
    if (hasSignature.current && canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    completeDelivery(delivery.id, {
      receiverName,
      receiverDoc,
      receiverRelationship,
      photoUrl: photo,
      notes: notes,
      signatureUrl
    });

    navigate('/history', { state: { newDeliveryId: delivery.id } });
  };

  const isValid = !!(receiverName && photo);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 pb-2 bg-white dark:bg-dark-surface shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold dark:text-white leading-tight">Confirmar Entrega</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Preencha os dados do recebimento</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <Card className="mb-6 bg-white dark:bg-dark-surface border-l-4 border-l-primary">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Cliente</p>
          <h2 className="text-lg font-bold dark:text-white">{delivery.customerName}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.address.fullAddress}</p>
        </Card>

        <form id="proof-form" onSubmit={handleSubmit} className="flex flex-col space-y-6">
          
          {/* Photo Section */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-between">
              Foto do Comprovante <span className="text-xs text-red-500 font-normal">*Obrigatório</span>
            </span>
            
            <input 
              type="file" 
              ref={cameraInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handlePhoto} 
            />
            <input 
              type="file" 
              ref={galleryInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhoto} 
            />
            
            {!photo ? (
              <div 
                id="photo-uploader"
                onClick={() => setShowPhotoOptions(true)}
                className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-dark-surface group active:scale-98 ${validationAttempt && !photo ? 'border-red-500 animate-shake' : 'border-gray-300 dark:border-dark-border'}`}
              >
                <div className="p-4 bg-gray-100 dark:bg-white/10 rounded-full mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-primary">
                  Toque para adicionar foto
                </span>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden shadow-lg group bg-gray-100 dark:bg-black/30">
                 <img src={photo} alt="Proof Preview" className="w-full h-48 object-cover" />
                 
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] z-20">
                    <button 
                      type="button"
                      onClick={() => setShowPhotoOptions(true)}
                      className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center hover:bg-gray-100 active:scale-95 transition-transform"
                    >
                      <Camera className="w-4 h-4 mr-2" /> Trocar
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold flex items-center hover:bg-red-700 active:scale-95 transition-transform"
                    >
                      <Maximize className="w-4 h-4 mr-2" /> Ampliar
                    </button>
                 </div>
                 
                 <button type="button" onClick={clearPhoto} className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 active:scale-90 transition-all z-20">
                    <X className="w-4 h-4" />
                 </button>
                 <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-md z-10">
                    <CheckCircle className="w-4 h-4" />
                 </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Input 
              label="Quem recebeu? *" 
              name="receiverName"
              value={receiverName} 
              onChange={handleReceiverNameChange}
              placeholder="Nome completo do recebedor"
              required
              className={validationAttempt && !receiverName ? "border-red-400 dark:border-red-600 ring-1 ring-red-400" : ""}
            />
            <Input 
              label="Documento (RG/CPF)" 
              value={receiverDoc} 
              onChange={e => setReceiverDoc(e.target.value)}
              placeholder="Apenas números (Opcional)"
            />
            <Input 
              label="Parentesco/Vínculo" 
              value={receiverRelationship} 
              onChange={e => setReceiverRelationship(e.target.value)}
              placeholder="Ex: Titular, Porteiro, Vizinho"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center">
                <PenTool className="w-4 h-4 mr-1.5" /> Assinatura Digital
              </label>
              <div className="flex items-center gap-2">
                 <button 
                    type="button" 
                    onClick={() => setIsSignatureFullscreen(true)}
                    className="text-xs text-primary hover:underline flex items-center"
                  >
                    <Maximize className="w-3 h-3 mr-1" /> Expandir
                 </button>
                 <button 
                  type="button" 
                  onClick={clearSignature} 
                  className="text-xs text-red-500 hover:underline flex items-center"
                 >
                  <Eraser className="w-3 h-3 mr-1" /> Limpar
                 </button>
              </div>
            </div>
            <div className={`border rounded-xl bg-white dark:bg-dark-surface overflow-hidden relative shadow-sm h-40 touch-none transition-all duration-200 ${isCanvasActive ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 dark:border-dark-border'}`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full block cursor-crosshair"
                onMouseDown={(e) => startDrawing(e, canvasRef.current)}
                onMouseMove={(e) => draw(e, canvasRef.current)}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => startDrawing(e, canvasRef.current)}
                onTouchMove={(e) => draw(e, canvasRef.current)}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature.current && !isCanvasActive && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <span className="text-gray-400 dark:text-gray-600 text-sm italic">Assine aqui...</span>
                 </div>
              )}
            </div>
          </div>

          <Textarea
            label="Observações"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Deixado na portaria, entregue ao vizinho, etc."
          />
        </form>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50 max-w-md mx-auto">
        {!isValid && validationAttempt && (
           <div className="flex items-center justify-center gap-2 mb-3 text-xs text-red-500 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Preencha o Nome e tire a Foto para concluir
           </div>
        )}
        <Button 
          type="submit" 
          form="proof-form"
          isLoading={isSaving}
          disabled={!isValid || isSaving}
          className={`w-full h-14 text-lg font-bold shadow-xl transition-all duration-300 ${
            isValid 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/25' 
              : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 shadow-none'
          }`}
        >
          {isSaving ? "Salvando Comprovante..." : (
            <>
              <Save className="w-6 h-6 mr-2" />
              Salvar Comprovante
            </>
          )}
        </Button>
      </div>

      {showPhotoOptions && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-bold text-center mb-4 dark:text-white">Adicionar Comprovante</h3>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowPhotoOptions(false);
                }}
                className="w-full"
              >
                <Camera className="w-5 h-5 mr-2" />
                Tirar Foto
              </Button>
              <Button 
                onClick={() => {
                  galleryInputRef.current?.click();
                  setShowPhotoOptions(false);
                }}
                variant="secondary"
                className="w-full"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Escolher da Galeria
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPhotoOptions(false)}
                className="w-full mt-2"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {isZoomOpen && photo && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <span className="text-white font-medium text-sm flex items-center">
              <Maximize className="w-4 h-4 mr-2 opacity-70" /> Visualização
            </span>
            <button 
              onClick={closeZoomModal}
              className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
             <div 
               style={{ 
                 transform: `scale(${zoomScale})`, 
                 transition: 'transform 0.2s ease-out',
                 transformOrigin: 'center center'
               }}
               className="relative"
             >
                <img 
                  src={photo} 
                  alt="Zoom Preview" 
                  className="max-w-full max-h-[80vh] object-contain shadow-2xl" 
                />
             </div>
          </div>

          <div className="p-6 pb-8 bg-gradient-to-t from-black/90 to-transparent flex justify-center gap-6 items-center z-10">
            <button 
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            
            <span className="text-white font-mono font-bold min-w-[3rem] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            
            <button 
              onClick={handleZoomIn}
              disabled={zoomScale >= 4}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {isSignatureFullscreen && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
          <header className="text-center p-2">
              <h2 className="text-lg font-bold text-white">Assinatura Digital</h2>
              <p className="text-sm text-gray-400">Desenhe na área abaixo</p>
          </header>
          <main className="flex-1 flex items-center justify-center my-4">
            <canvas 
              ref={fullscreenCanvasRef} 
              className="bg-white dark:bg-dark-surface rounded-lg shadow-2xl touch-none"
              onMouseDown={(e) => startDrawing(e, fullscreenCanvasRef.current)}
              onMouseMove={(e) => draw(e, fullscreenCanvasRef.current)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => startDrawing(e, fullscreenCanvasRef.current)}
              onTouchMove={(e) => draw(e, fullscreenCanvasRef.current)}
              onTouchEnd={stopDrawing}
            />
          </main>
          <footer className="flex justify-center items-center gap-3 p-2 flex-wrap">
              <Button variant="outline" onClick={() => setIsSignatureFullscreen(false)} className="border-gray-600 text-gray-300">
                  <X className="w-5 h-5 mr-2" /> Cancelar
              </Button>
              <Button variant="danger" onClick={clearFullscreenSignature}>
                  <Eraser className="w-5 h-5 mr-2" /> Limpar
              </Button>
              <Button onClick={confirmFullscreenSignature} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-5 h-5 mr-2" /> Confirmar
              </Button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default ProofOfDelivery;