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
  Search
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newEntries: PhotoEntry[] = Array.from(files).map((file: File) => ({
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
    }));

    setPhotos(prev => [...prev, ...newEntries]);
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
      const response = await fetch(photo.processedUrl || photo.blobUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob);

      const res = await fetch('/api/enhance', { method: 'POST', body: formData });
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
      const response = await fetch(photo.processedUrl || photo.blobUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob);

      const res = await fetch('/api/remove-bg', { method: 'POST', body: formData });
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
        const response = await fetch(photo.processedUrl || photo.blobUrl);
        const blob = await response.blob();
        formData.append('images', blob);
      }
      formData.append('photoWidth', prefs.defaultWidth.toString());
      formData.append('photoHeight', prefs.defaultHeight.toString());
      formData.append('spacing', prefs.spacing.toString());
      formData.append('margin', prefs.margin.toString());
      formData.append('borderSize', prefs.borderSize.toString());
      formData.append('totalCopies', totalCopies.toString());

      const res = await fetch('/api/process', { method: 'POST', body: formData });
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">YUGAL</h1>
            <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Passport Photo V2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search images..."
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)]">
        {/* Sidebar Controls */}
        <aside className="w-80 border-r border-white/5 bg-white/2 backdrop-blur-md p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Sheet Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/60">Width (mm)</label>
                  <input 
                    type="number" 
                    value={prefs.defaultWidth}
                    onChange={(e) => setPrefs({...prefs, defaultWidth: parseInt(e.target.value) || 35})}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/60">Height (mm)</label>
                  <input 
                    type="number" 
                    value={prefs.defaultHeight}
                    onChange={(e) => setPrefs({...prefs, defaultHeight: parseInt(e.target.value) || 45})}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-xs text-white/60">Grid Spacing</span>
                  <input 
                    type="range" min="0" max="20" 
                    value={prefs.spacing}
                    onChange={(e) => setPrefs({...prefs, spacing: parseInt(e.target.value)})}
                    className="w-24 accent-blue-500" 
                  />
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-xs text-white/60">Border Size</span>
                  <input 
                    type="range" min="0" max="5" 
                    value={prefs.borderSize}
                    onChange={(e) => setPrefs({...prefs, borderSize: parseInt(e.target.value)})}
                    className="w-24 accent-blue-500" 
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Filter by Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs transition-all border",
                      filterCategory === cat 
                        ? "bg-blue-600 border-blue-500 text-white" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Maximize2 className="w-3 h-3" />
                Print Configuration
              </h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest block mb-2">Total Copies Required</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setTotalCopies(Math.max(1, totalCopies - 1))} className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">-</button>
                    <input 
                      type="number" 
                      value={totalCopies}
                      onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-transparent text-center text-lg font-bold focus:outline-none"
                    />
                    <button onClick={() => setTotalCopies(totalCopies + 1)} className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">+</button>
                  </div>
                  <div className="mt-2 text-[10px] text-blue-400 font-mono text-center">
                    Estimated: {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={() => setIsPreviewing(true)}
                disabled={photos.length === 0 || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-2 shadow-lg shadow-blue-600/20"
              >
                <Maximize2 className="w-5 h-5" />
                <span>Preview Layout</span>
              </button>
              <button 
                onClick={generatePDF}
                disabled={photos.length === 0 || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-bold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>Download Print PDF</span>
              </button>
              <p className="text-[10px] text-center text-white/20 mt-3 font-mono">ULTRA-HIGH RES EXPORT ENABLED</p>
            </div>
          </div>
        </aside>

        {/* Workspace Display */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
          <AnimatePresence mode="popLayout">
            {filteredPhotos.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-2">
                  <Upload className="w-10 h-10 text-white/20" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white/80">Workspace is empty</h2>
                  <p className="text-white/40 max-w-sm mx-auto mt-2">Upload your portrait photos to start creating high-density passport photo sheets.</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
                >
                  Browse Files
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPhotos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md hover:border-blue-500/50 transition-all",
                      selectedPhotoId === photo.id && "ring-2 ring-blue-500 border-transparent shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                    )}
                    onClick={() => setSelectedPhotoId(photo.id)}
                  >
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <img 
                        src={photo.processedUrl || photo.blobUrl} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); startCrop(photo.id); }}
                          className="p-2 bg-black/60 shadow-lg backdrop-blur-md rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Crop className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                          className="p-2 bg-black/60 shadow-lg backdrop-blur-md rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                        <p className="text-xs font-medium truncate mb-1">{photo.originalName}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/50 uppercase font-mono">{photo.category}</span>
                          <span className="flex items-center gap-1 text-[10px] py-0.5 px-2 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                            v{photo.version}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Compact Card Actions */}
                    <div className="p-3 grid grid-cols-2 gap-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleEnhance(photo.id); }}
                        className="flex items-center justify-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5 transition-all"
                       >
                         <Shield className="w-3 h-3 text-blue-400" />
                         <span>Enhance</span>
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveBg(photo.id); }}
                        className="flex items-center justify-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5 transition-all"
                       >
                         <Maximize2 className="w-3 h-3 text-purple-400" />
                         <span>Clear BG</span>
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Detail Pane (History & Metadata) */}
        {selectedPhoto && (
          <aside className="w-80 border-l border-white/5 bg-white/2 backdrop-blur-md p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
              <List className="w-3 h-3" />
              Photo Details
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest">Category</label>
                <select 
                  value={selectedPhoto.category}
                  onChange={(e) => updatePhoto(selectedPhoto.id, { category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="Uncategorized">Uncategorized</option>
                  <option value="Work">Professional</option>
                  <option value="Visa">Visa / Identity</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedPhoto.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded flex items-center gap-1 text-[10px]">
                      {tag}
                      <button onClick={() => updatePhoto(selectedPhoto.id, { tags: selectedPhoto.tags.filter(t => t !== tag) })}><Trash2 className="w-2 h-2" /></button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="Press enter to add..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val && !selectedPhoto.tags.includes(val)) {
                        updatePhoto(selectedPhoto.id, { tags: [...selectedPhoto.tags, val] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] text-white/40 uppercase tracking-widest">Version History</h4>
                {selectedPhoto.history.length === 0 ? (
                  <p className="text-[10px] text-white/20 italic">No previous versions.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPhoto.history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-all cursor-pointer" onClick={() => updatePhoto(selectedPhoto.id, { processedUrl: h.url })}>
                        <div className="flex items-center gap-3">
                          <History className="w-4 h-4 text-white/40" />
                          <div>
                            <p className="text-xs">{h.label}</p>
                            <p className="text-[8px] text-white/40">{new Date(h.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Crop Modal */}
      <AnimatePresence>
        {isCropping && selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col max-h-screen">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Crop className="text-blue-500" />
                  Crop Selection
                </h2>
                <button onClick={() => setIsCropping(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Trash2 className="w-5 h-5 text-white/40" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden p-6 bg-black">
                <Cropper
                  src={selectedPhoto.blobUrl}
                  style={{ height: '100%', width: '100%' }}
                  aspectRatio={prefs.defaultWidth / prefs.defaultHeight}
                  guides={true}
                  ref={cropperRef}
                />
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/50">
                <button 
                  onClick={() => setIsCropping(false)}
                  className="px-6 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={applyCrop}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                >
                  Save Version
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl shadow-blue-500/10">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <FileText className="text-blue-500" />
                    Print Sheet Preview
                  </h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                    {totalCopies} Photos • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} • Optimized for A4 Printing
                  </p>
                </div>
                <button onClick={() => setIsPreviewing(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Trash2 className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-black/40 flex flex-col items-center gap-8 custom-scrollbar">
                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                  const itemsOnThisPageCount = Math.min(perPage, totalCopies - (pageIdx * perPage));
                  
                  return (
                    <div 
                      key={pageIdx}
                      className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-black/10 relative overflow-hidden flex flex-col items-center"
                      style={{ 
                        width: '210mm', 
                        height: '297mm', 
                        padding: `${prefs.margin}mm`,
                        transform: 'scale(0.8)', // Scale down for viewable screen size
                        transformOrigin: 'top center',
                        marginBottom: '-50mm' // Adjust for scale overlap
                      }}
                    >
                      <div className="absolute top-2 right-2 text-[8px] text-black/20 font-bold uppercase tracking-widest">
                        Page {pageIdx + 1} of {totalPages}
                      </div>
                      
                      {/* Simulating Grid Rendering matching Server Logic */}
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
                              className="bg-gray-100 border border-gray-200 overflow-hidden"
                              style={{ 
                                width: `${prefs.defaultWidth}mm`, 
                                height: `${prefs.defaultHeight}mm`,
                                borderWidth: `${prefs.borderSize}mm`,
                                borderColor: 'white'
                              }}
                            >
                              <img 
                                src={photoToUse?.processedUrl || photoToUse?.blobUrl} 
                                className="w-full h-full object-cover grayscale opacity-80" 
                                alt="preview"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/50 backdrop-blur-md">
                <button 
                  onClick={() => setIsPreviewing(false)}
                  className="px-6 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
                >
                  Back to Editor
                </button>
                <button 
                  onClick={() => { setIsPreviewing(false); generatePDF(); }}
                  className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Accept & Download PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-blue-600/10 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <Zap className="absolute inset-0 m-auto w-8 h-8 text-blue-500 animate-pulse" fill="currentColor" />
            </div>
            <p className="mt-6 text-sm font-medium tracking-[0.2em] text-blue-400 uppercase animate-pulse">Running AI Microservices</p>
            <div className="mt-2 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                className="h-full bg-blue-500" 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
