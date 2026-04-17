/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Download, 
  Crop, 
  History, 
  Settings, 
  Plus, 
  FileText, 
  Shield, 
  Zap, 
  Maximize2,
  List,
  Save,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Moon,
  Sun,
  X,
  CheckCircle2,
  MoreVertical,
  LayoutGrid,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PhotoEntry {
  id: string;
  originalName: string;
  blobUrl: string;
  processedUrl?: string;
  copies: number;
  width: number;
  height: number;
  tags: string[];
  category: string;
  version: number;
  history: { url: string; date: string; label: string }[];
}

interface UserPreferences {
  defaultWidth: number;
  defaultHeight: number;
  spacing: number;
  margin: number;
  borderSize: number;
}

export default function App() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [totalCopies, setTotalCopies] = useState(8);
  const [prefs, setPrefs] = useState<UserPreferences>({
    defaultWidth: 35,
    defaultHeight: 45,
    spacing: 5,
    margin: 10,
    borderSize: 0,
  });

  const cropperRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Theme support
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Layout Calculation Helper
  const calculateLayout = () => {
    const A4_W = 210; // mm
    const A4_H = 297; // mm
    const availW = A4_W - (prefs.margin * 2);
    const availH = A4_H - (prefs.margin * 2);

    const cols = Math.floor((availW + prefs.spacing) / (prefs.defaultWidth + prefs.spacing));
    const rowsPerPage = Math.floor((availH + prefs.spacing) / (prefs.defaultHeight + prefs.spacing));
    const perPage = cols * rowsPerPage;
    const totalPages = Math.ceil(totalCopies / perPage);

    return { cols, rowsPerPage, perPage, totalPages };
  };

  const { cols, rowsPerPage, perPage, totalPages } = calculateLayout();

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('yugal_app_data');
    if (saved) {
      const data = JSON.parse(saved);
      setPhotos(data.photos || []);
      setPrefs(data.prefs || prefs);
      setTotalCopies(data.totalCopies || 8);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('yugal_app_data', JSON.stringify({ photos, prefs, totalCopies }));
  }, [photos, prefs, totalCopies]);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          addPhotoEntry(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const addPhotoEntry = (file: File) => {
    const newEntry: PhotoEntry = {
      id: Math.random().toString(36).substring(7),
      originalName: file.name,
      blobUrl: URL.createObjectURL(file),
      copies: 8,
      width: prefs.defaultWidth,
      height: prefs.defaultHeight,
      tags: [],
      category: 'Uncategorized',
      version: 1,
      history: []
    };
    setPhotos(prev => [...prev, newEntry]);
    setSelectedPhotoId(newEntry.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addPhotoEntry);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (selectedPhotoId === id) setSelectedPhotoId(null);
  };

  const updatePhoto = (id: string, updates: Partial<PhotoEntry>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  const startCrop = (id: string) => {
    setSelectedPhotoId(id);
    setIsCropping(true);
  };

  const applyCrop = () => {
    const cropper = (cropperRef.current as any)?.cropper;
    if (cropper && selectedPhotoId) {
      const croppedCanvas = cropper.getCroppedCanvas();
      croppedCanvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const historyEntry = { url: selectedPhoto?.processedUrl || selectedPhoto?.blobUrl || '', date: new Date().toISOString(), label: `v${selectedPhoto?.version || 1}` };
          
          updatePhoto(selectedPhotoId, {
            processedUrl: url,
            version: (selectedPhoto?.version || 1) + 1,
            history: [...(selectedPhoto?.history || []), historyEntry]
          });
          setIsCropping(false);
        }
      });
    }
  };

  const handleEnhance = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    
    setIsProcessing(true);
    try {
      const response = await window.fetch(photo.processedUrl || photo.blobUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob);

      const res = await window.fetch('/api/enhance', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.url) {
        updatePhoto(id, { 
          processedUrl: data.url,
          version: photo.version + 1,
          history: [...photo.history, { url: photo.processedUrl || photo.blobUrl, date: new Date().toISOString(), label: 'Enhanced' }]
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBg = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    
    setIsProcessing(true);
    try {
      const response = await window.fetch(photo.processedUrl || photo.blobUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob);

      const res = await window.fetch('/api/remove-bg', { method: 'POST', body: formData });
      const processedBlob = await res.blob();
      const url = URL.createObjectURL(processedBlob);
      
      updatePhoto(id, { 
        processedUrl: url,
        version: photo.version + 1,
        history: [...photo.history, { url: photo.processedUrl || photo.blobUrl, date: new Date().toISOString(), label: 'BG Removed' }]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      for (const photo of photos) {
        const response = await window.fetch(photo.processedUrl || photo.blobUrl);
        const blob = await response.blob();
        formData.append('images', blob);
      }
      formData.append('photoWidth', prefs.defaultWidth.toString());
      formData.append('photoHeight', prefs.defaultHeight.toString());
      formData.append('spacing', prefs.spacing.toString());
      formData.append('margin', prefs.margin.toString());
      formData.append('borderSize', prefs.borderSize.toString());
      formData.append('totalCopies', totalCopies.toString());

      const res = await window.fetch('/api/process', { method: 'POST', body: formData });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(photos.map(p => p.category)))];
  const filteredPhotos = photos.filter(p => {
    const matchesSearch = p.originalName.toLowerCase().includes(searchTerm.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-ios-blue/30 transition-colors duration-300">
      {/* iOS Status Bar Replacement / Header */}
      <header className="sticky top-0 z-50 ios-glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ios-blue rounded-xl flex items-center justify-center shadow-lg shadow-ios-blue/20">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">YUGAL</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono tracking-widest uppercase">Passport V2.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--separator)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-all active:scale-95"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setIsCameraActive(true) || startCamera()}
            className="p-2.5 rounded-full bg-ios-blue text-white shadow-lg shadow-ios-blue/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 pb-32">
        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-ios-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Search moments..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--separator)] rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue/50 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shadow-sm",
                  filterCategory === cat 
                    ? "bg-ios-blue border-transparent text-white" 
                    : "bg-[var(--bg-secondary)] border-[var(--separator)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State / Photo Grid */}
        <AnimatePresence mode="popLayout">
          {filteredPhotos.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 bg-ios-blue/5 rounded-full flex items-center justify-center mb-6 relative">
                <ImageIcon className="w-10 h-10 text-ios-blue opacity-40" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-ios-blue rounded-full"
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Print?</h2>
              <p className="text-[var(--text-tertiary)] max-w-xs mx-auto mb-8">
                Take a photo or upload from your gallery to create professional passport sheets locally.
              </p>
              
              <div className="flex flex-col w-full max-w-xs gap-3 font-semibold">
                <button 
                  onClick={() => setIsCameraActive(true) || startCamera()}
                  className="ios-button-primary"
                >
                  <Camera className="w-5 h-5" />
                  Take a Photo
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="ios-button-secondary"
                >
                  <Upload className="w-5 h-5" />
                  Import from Files
                </button>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "group ios-card relative transition-all active:scale-[0.97]",
                    selectedPhotoId === photo.id && "ring-2 ring-ios-blue ring-offset-4 ring-offset-[var(--bg-primary)]"
                  )}
                  onClick={() => setSelectedPhotoId(photo.id)}
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img 
                      src={photo.processedUrl || photo.blobUrl} 
                      alt="Portrait" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startCrop(photo.id); }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-black hover:bg-white transition-all shadow-lg"
                      >
                        <Crop className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-ios-red hover:bg-ios-red hover:text-white transition-all shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[9px] font-bold text-white uppercase tracking-wider">
                      v{photo.version}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-[var(--bg-secondary)]">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold text-ios-blue leading-none">AI READY</span>
                       <CheckCircle2 className="w-3 h-3 text-ios-green" />
                    </div>
                    <p className="text-[11px] font-semibold truncate text-[var(--text-secondary)] opacity-80">{photo.originalName}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* Add More Cell */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="ios-card aspect-[3/4] flex flex-col items-center justify-center gap-2 border-dashed border-2 border-[var(--separator)] bg-transparent hover:bg-[var(--bg-secondary)] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-ios-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-ios-blue" />
                </div>
                <span className="text-[10px] font-bold text-ios-blue uppercase tracking-widest">Add More</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Menu (iOS Inspired) */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg"
          >
            <div className="ios-glass p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4 border border-white/20">
              <div className="flex items-center gap-4 pl-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ios-blue leading-none mb-1">Print Batch</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setTotalCopies(Math.max(1, totalCopies - 1))}
                      className="w-6 h-6 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-primary)] active:scale-95"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold min-w-[1.5rem] text-center">{totalCopies}</span>
                    <button 
                      onClick={() => setTotalCopies(totalCopies + 1)}
                      className="w-6 h-6 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-primary)] active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPreviewing(true)}
                  className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] border border-[var(--separator)] flex items-center justify-center shadow-lg active:scale-95 transition-all text-[var(--text-primary)]"
                >
                  <LayoutGrid className="w-6 h-6" />
                </button>
                <button 
                  onClick={generatePDF}
                  disabled={isProcessing}
                  className="h-14 px-6 rounded-full bg-ios-blue text-white font-bold flex items-center gap-3 shadow-lg shadow-ios-blue/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  <span>Generate Sheet</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera View Modal */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <div className="absolute top-6 inset-x-0 px-6 flex items-center justify-between z-10">
               <button onClick={stopCamera} className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white">
                 <X className="w-6 h-6" />
               </button>
               <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest">
                 Live Capture
               </div>
               <div className="w-12 h-12" /> {/* Spacer */}
            </div>
            
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover md:rounded-3xl md:h-[80%] md:w-auto md:aspect-video" 
               />
               <canvas ref={canvasRef} className="hidden" />
               
               {/* Guides Overlay */}
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 <div className="w-[280px] h-[360px] border-2 border-white/30 rounded-3xl relative">
                    <div className="absolute top-1/4 inset-x-0 h-px bg-white/20" />
                    <div className="absolute top-1/2 inset-x-0 h-px bg-white/20" />
                    <div className="absolute bottom-1/4 inset-x-0 h-px bg-white/20" />
                 </div>
               </div>
            </div>

            <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-8">
               <div className="text-white/60 text-xs font-medium px-8 text-center max-w-xs">
                 Position your face within the frame and ensure even lighting.
               </div>
               <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
               >
                 <div className="w-16 h-16 rounded-full bg-white transition-all hover:bg-white/90" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal Refinement */}
      <AnimatePresence>
        {isCropping && selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] ios-glass flex items-center justify-center p-4"
          >
            <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] overflow-hidden max-w-4xl w-full flex flex-col h-[90vh] shadow-2xl border border-[var(--separator)]">
              <div className="p-6 border-b border-[var(--separator)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ios-blue/10 rounded-xl flex items-center justify-center">
                    <Crop className="text-ios-blue w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Adjust Composition</h2>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest">{selectedPhoto.width}x{selectedPhoto.height} mm Portrait</p>
                  </div>
                </div>
                <button onClick={() => setIsCropping(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors">
                  <X className="w-6 h-6 text-[var(--text-tertiary)]" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden p-6 bg-black flex items-center justify-center">
                <div className="w-full h-full max-h-[60vh]">
                  <Cropper
                    src={selectedPhoto.blobUrl}
                    style={{ height: '100%', width: '100%' }}
                    aspectRatio={prefs.defaultWidth / prefs.defaultHeight}
                    guides={true}
                    ref={cropperRef}
                    background={false}
                    autoCropArea={0.8}
                    viewMode={1}
                  />
                </div>
              </div>

              <div className="p-8 border-t border-[var(--separator)] bg-[var(--bg-secondary)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-[var(--text-tertiary)] text-xs max-w-xs text-center md:text-left">
                  Use the handles to frame the head and shoulders correctly for passport standards.
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setIsCropping(false)}
                    className="ios-button-secondary flex-1 md:flex-none"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={applyCrop}
                    className="ios-button-primary flex-1 md:flex-none"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal Refinement */}
      <AnimatePresence>
        {isPreviewing && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[150] bg-[var(--bg-primary)] flex flex-col scroll-smooth overflow-y-auto no-scrollbar"
          >
            <nav className="sticky top-0 z-50 ios-glass px-6 py-4 flex items-center justify-between">
               <button onClick={() => setIsPreviewing(false)} className="flex items-center gap-2 text-ios-blue font-semibold">
                 <X className="w-5 h-5" />
                 <span>Close</span>
               </button>
               <div className="text-center">
                 <h2 className="text-sm font-bold">Print Sheet Preview</h2>
                 <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest">{totalPages}x A4 PDF Documents</p>
               </div>
               <button 
                onClick={() => { setIsPreviewing(false); generatePDF(); }}
                className="ios-button-primary !py-2 !px-4"
               >
                 <Download className="w-4 h-4" />
                 <span>Save PDF</span>
               </button>
            </nav>

            <div className="flex-1 p-8 pb-20 flex flex-col items-center gap-12 max-w-4xl mx-auto w-full">
                {/* Configuration HUD */}
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="ios-card p-4 flex flex-col">
                      <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest mb-1">Dimensions</span>
                      <span className="text-sm font-bold">{prefs.defaultWidth}x{prefs.defaultHeight}mm</span>
                   </div>
                   <div className="ios-card p-4 flex flex-col">
                      <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest mb-1">Grid Pattern</span>
                      <span className="text-sm font-bold">{cols}x{rowsPerPage} Grid</span>
                   </div>
                   <div className="ios-card p-4 flex flex-col">
                      <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest mb-1">Total Photos</span>
                      <span className="text-sm font-bold">{totalCopies} Copies</span>
                   </div>
                   <div className="ios-card p-4 flex flex-col">
                      <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest mb-1">Export Scale</span>
                      <span className="text-sm font-bold text-ios-green">300 DPI (Ultra)</span>
                   </div>
                </div>

                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                  const itemsOnThisPageCount = Math.min(perPage, totalCopies - (pageIdx * perPage));
                  
                  return (
                    <motion.div 
                      key={pageIdx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="bg-white shadow-2xl relative overflow-hidden flex flex-col items-center border border-black/5"
                      style={{ 
                        width: '210mm', 
                        height: '297mm', 
                        padding: `${prefs.margin}mm`,
                        transform: 'scale(auto)',
                        maxWidth: '100%'
                      }}
                    >
                      <div className="absolute top-4 right-6 text-[10px] text-black/10 font-bold uppercase tracking-[0.3em]">
                        Sheet Asset • {pageIdx + 1} / {totalPages}
                      </div>
                      
                      <div 
                        className="w-full h-full flex flex-wrap content-start items-start justify-center"
                        style={{ gap: `${prefs.spacing}mm` }}
                      >
                        {Array.from({ length: itemsOnThisPageCount }).map((__, itemIdx) => {
                          const totalItemIdx = pageIdx * perPage + itemIdx;
                          const photoToUse = photos[totalItemIdx % photos.length];
                          
                          return (
                            <div 
                              key={itemIdx}
                              className="bg-gray-100 border border-gray-100 overflow-hidden shadow-sm"
                              style={{ 
                                width: `${prefs.defaultWidth}mm`, 
                                height: `${prefs.defaultHeight}mm`,
                                borderWidth: `${prefs.borderSize}mm`,
                                borderColor: 'white'
                              }}
                            >
                              <img 
                                src={photoToUse?.processedUrl || photoToUse?.blobUrl} 
                                className="w-full h-full object-cover transition-all" 
                                alt="preview"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {/* Bottom Safe Area Padding */}
            <div className="h-24 w-full" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Processing Loader Refinement */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] ios-glass flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-[6px] border-ios-blue/10 border-t-ios-blue rounded-full" 
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Zap className="w-10 h-10 text-ios-blue" fill="currentColor" />
              </motion.div>
            </div>
            
            <h3 className="text-xl font-bold mb-2">Architecting Your Sheet</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-[200px] font-medium leading-relaxed uppercase tracking-widest">
              AI Microservices performing high-res restoration
            </p>
            
            <div className="mt-8 w-64 h-1.5 bg-[var(--separator)] rounded-full overflow-hidden">
               <motion.div 
                className="h-full bg-ios-blue" 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity }}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Selection / Details Drawer (iOS Inspired) */}
      <AnimatePresence>
        {selectedPhoto && !isCropping && !isCameraActive && !isPreviewing && (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed top-24 bottom-24 right-4 z-30 w-[calc(100%-2rem)] md:w-96 ios-glass rounded-[2rem] shadow-2xl border border-white/20 p-6 flex flex-col pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Metadata</h3>
              <button 
                onClick={() => setSelectedPhotoId(null)}
                className="p-2 bg-[var(--bg-primary)] rounded-full text-[var(--text-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleEnhance(selectedPhoto.id)}
                  className="ios-button-secondary !py-4 flex-col gap-2"
                >
                  <Zap className="w-6 h-6 text-ios-blue" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Restore</span>
                </button>
                <button 
                  onClick={() => handleRemoveBg(selectedPhoto.id)}
                  className="ios-button-secondary !py-4 flex-col gap-2"
                >
                  <Filter className="w-6 h-6 text-ios-green" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Clean BG</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="ios-card p-4 space-y-3">
                  <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest block">Collection / Category</label>
                  <select 
                    value={selectedPhoto.category}
                    onChange={(e) => updatePhoto(selectedPhoto.id, { category: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="ios-card p-4 space-y-3">
                  <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest block">Associated Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-ios-blue/10 text-ios-blue rounded-full text-[10px] font-bold flex items-center gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => updatePhoto(selectedPhoto.id, { tags: selectedPhoto.tags.filter(t => t !== tag) })} />
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add tag..."
                    className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-xl p-3 text-sm focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          updatePhoto(selectedPhoto.id, { tags: [...selectedPhoto.tags, val] });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>

                <div className="space-y-3">
                   <h4 className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest px-1">Processing History</h4>
                   <div className="space-y-2">
                     {selectedPhoto.history.length === 0 ? (
                       <div className="ios-card p-4 text-center text-[10px] text-[var(--text-tertiary)] italic">No revisions yet</div>
                     ) : (
                       selectedPhoto.history.map((h, i) => (
                         <div 
                          key={i} 
                          onClick={() => updatePhoto(selectedPhoto.id, { processedUrl: h.url })}
                          className="ios-card p-3 flex items-center justify-between hover:bg-[var(--bg-primary)] cursor-pointer group"
                         >
                           <div className="flex items-center gap-3">
                             <History className="w-4 h-4 text-ios-blue opacity-40 group-hover:opacity-100 transition-opacity" />
                             <div>
                               <p className="text-xs font-bold">{h.label}</p>
                               <p className="text-[9px] text-[var(--text-tertiary)]">{new Date(h.date).toLocaleTimeString()}</p>
                             </div>
                           </div>
                           <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                         </div>
                       ))
                     )}
                   </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
               <button 
                onClick={() => startCrop(selectedPhoto.id)}
                className="flex-1 ios-button-secondary"
               >
                 Re-Crop
               </button>
               <button 
                onClick={() => deletePhoto(selectedPhoto.id)}
                className="ios-button-secondary !text-ios-red !border-ios-red/20 !bg-ios-red/5"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
