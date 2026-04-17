import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Download, 
  Crop, 
  History, 
  Plus, 
  Zap, 
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Moon,
  Sun,
  X,
  CheckCircle2,
  LayoutGrid,
  Image as ImageIcon,
  Smartphone,
  ExternalLink,
  Info,
  ChevronLeft,
  Settings,
  Share2,
  Star,
  ShieldCheck,
  MousePointer2,
  Maximize,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import { savePhotoBlob, getPhotoBlob, deletePhotoBlob } from './lib/db';
import { jsPDF } from 'jspdf';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UI = {
  glass: "backdrop-blur-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] transition-all",
  card: "bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden",
  btnBase: "flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-3 active:scale-[0.98] transition-all",
  btnPrimary: "flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-3 active:scale-[0.98] transition-all bg-ios-blue text-white shadow-lg shadow-ios-blue/20 hover:brightness-110",
  btnSecondary: "flex items-center justify-center gap-2 font-semibold rounded-xl px-4 py-3 active:scale-[0.98] transition-all bg-[var(--bg-secondary)] text-ios-blue border border-[var(--separator)]",
};

// --- TYPES ---
interface PhotoEntry {
  id: string;
  originalName: string;
  blobUrl: string; // Transient URL for live session
  processedUrl?: string; // Transient URL for live session
  copies: number;
  width: number;
  height: number;
  tags: string[];
  category: string;
  version: number;
  history: { url: string; date: string; label: string }[];
  filters: {
    brightness: number;
    contrast: number;
    grayscale: boolean;
  };
}

interface UserPreferences {
  defaultWidth: number;
  defaultHeight: number;
  spacing: number;
  margin: number;
  borderSize: number;
  paperSize: 'A4' | '4x6' | '5x7';
}

// --- COMPONENTS ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
    className="fixed inset-0 z-[1000] bg-white dark:bg-black flex flex-col items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative"
    >
      <div className="w-24 h-24 bg-ios-blue rounded-[2rem] flex items-center justify-center shadow-2xl shadow-ios-blue/30">
        <Zap className="text-white w-12 h-12" fill="currentColor" />
      </div>
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-x-0 -bottom-4 h-8 bg-ios-blue filter blur-2xl rounded-full"
      />
    </motion.div>
    
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="mt-8 text-center"
    >
      <h1 className="text-2xl font-bold tracking-tight">YUGAL</h1>
      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.3em] mt-1">Professional Portrait Engine</p>
    </motion.div>

    <motion.div 
      className="absolute bottom-12 w-48 h-1 bg-[var(--separator)] rounded-full overflow-hidden"
    >
      <motion.div 
        className="h-full bg-ios-blue"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
        onAnimationComplete={onComplete}
      />
    </motion.div>
  </motion.div>
);

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden">
    <header className="fixed top-0 inset-x-0 z-50 p-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 bg-ios-blue rounded-lg flex items-center justify-center shadow-lg">
           <Zap className="text-white w-5 h-5" fill="currentColor" />
         </div>
         <span className="font-bold text-lg">YUGAL</span>
      </div>
      <button 
        onClick={onStart}
        className="px-6 py-2 bg-ios-blue text-white rounded-full font-bold shadow-lg shadow-ios-blue/20 hover:scale-105 transition-transform"
      >
        Open App
      </button>
    </header>

    <main className="pt-32 px-6 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ios-blue/10 rounded-full text-ios-blue text-xs font-bold uppercase tracking-widest border border-ios-blue/20">
              <ShieldCheck className="w-3 h-3" />
              100% Private • Local-First
            </div>
            <h2 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight">
              Pro Passport <br />
              <span className="text-ios-blue">Photos</span> in <br />
              Seconds.
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Generate perfect, printable passport sheets with AI enhancement. Zero login, zero cloud storage, complete privacy.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-ios-blue text-white rounded-2xl font-bold text-xl shadow-2xl shadow-ios-blue/30 active:scale-95 transition-all flex items-center gap-3"
            >
              Start Creating
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4 px-6 py-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--separator)] shadow-sm">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => (
                     <img key={i} src={`https://picsum.photos/seed/${i}/40/40`} className="w-10 h-10 rounded-full border-4 border-[var(--bg-secondary)]" />
                   ))}
                </div>
                <div>
                   <p className="text-xs font-bold">50k+ Prints</p>
                   <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-2 h-2 fill-ios-green text-ios-green" />)}
                   </div>
                </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex-1 relative"
        >
          <div className={cn("relative z-10 aspect-[3/4] w-full max-w-sm mx-auto p-4 rotate-3 shadow-2xl", UI.card)}>
             <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
                <img src="https://picsum.photos/seed/portrait/800/1000" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                   <div className="flex items-center gap-2 mb-2">
                       <CheckCircle2 className="text-ios-green w-5 h-5" />
                       <span className="text-white font-bold text-sm">BIOMETRIC READY</span>
                   </div>
                   <p className="text-white/80 text-xs">A4 Printable sheet generated with 35x45mm presets.</p>
                </div>
             </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-ios-blue/10 filter blur-[100px] -z-10 rounded-full" />
        </motion.div>
      </div>

      <section className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
         <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-ios-blue" />}
            title="Privacy Guard"
            desc="Your photos never leave your device. All processing happens in your browser."
         />
         <FeatureCard 
            icon={<Zap className="w-8 h-8 text-ios-green" />}
            title="AI Enhancement"
            desc="One-tap restoration to fix lighting, contrast, and remove cluttered backgrounds."
         />
         <FeatureCard 
            icon={<LayoutGrid className="w-8 h-8 text-ios-red" />}
            title="Smart Tiling"
            desc="Automatically arrange images on A4 or 4x6 paper to maximize space and save money."
         />
      </section>
    </main>

    <footer className="mt-40 p-12 bg-[var(--bg-secondary)] border-t border-[var(--separator)] text-center">
       <p className="text-[var(--text-tertiary)] text-sm">© 2026 YUGAL Portrait Engine • Made with ❤️ for Privacy</p>
    </footer>
  </div>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className={cn("p-10 space-y-4 hover:scale-[1.02] transition-transform", UI.card)}>
    <div className="w-16 h-16 bg-ios-blue/5 rounded-[1.5rem] flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-2xl font-bold">{title}</h3>
    <p className="text-[var(--text-secondary)] leading-relaxed">{desc}</p>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appStarted, setAppStarted] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('user_remove_bg_key') || '');
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
    paperSize: 'A4'
  });

  const cropperRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- PERSISTENCE ---

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem('yugal_app_data');
    if (saved) {
      const data = JSON.parse(saved);
      setPrefs(data.prefs || prefs);
      setTotalCopies(data.totalCopies || 8);
      
      // We don't store photos in localStorage, only metadata.
      // We'll need to re-hydrate blob URLs from IndexedDB.
      if (data.photos) {
          hydratePhotos(data.photos);
      }
    }
  }, []);

  const hydratePhotos = async (metadata: any[]) => {
    const hydrated = await Promise.all(metadata.map(async (m) => {
      const blob = await getPhotoBlob(m.id);
      if (blob) {
        return { ...m, blobUrl: URL.createObjectURL(blob) };
      }
      return null;
    }));
    setPhotos(hydrated.filter(p => p !== null) as PhotoEntry[]);
  };

  // Save changes to localStorage (excluding blob URLs)
  useEffect(() => {
    const metadata = photos.map(({ blobUrl, processedUrl, ...p }) => p);
    localStorage.setItem('yugal_app_data', JSON.stringify({ photos: metadata, prefs, totalCopies }));
  }, [photos, prefs, totalCopies]);

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

  // --- CAMERA ---
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

  const addPhotoEntry = async (file: File) => {
    const id = uuidv4();
    const url = URL.createObjectURL(file);
    
    // Save blob to IndexedDB
    await savePhotoBlob(id, file);

    const newEntry: PhotoEntry = {
      id,
      originalName: file.name,
      blobUrl: url,
      copies: 8,
      width: prefs.defaultWidth,
      height: prefs.defaultHeight,
      tags: [],
      category: 'Recent',
      version: 1,
      history: [],
      filters: { brightness: 100, contrast: 100, grayscale: false }
    };

    setPhotos(prev => [newEntry, ...prev]);
    setSelectedPhotoId(id);
    setAppStarted(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addPhotoEntry);
  };

  const deletePhoto = async (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    await deletePhotoBlob(id);
    if (selectedPhotoId === id) setSelectedPhotoId(null);
  };

  const updatePhoto = (id: string, updates: Partial<PhotoEntry>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  const applyCrop = () => {
    const cropper = (cropperRef.current as any)?.cropper;
    if (cropper && selectedPhotoId) {
      const croppedCanvas = cropper.getCroppedCanvas();
      croppedCanvas.toBlob(async (blob: Blob | null) => {
        if (blob && selectedPhoto) {
          const url = URL.createObjectURL(blob);
          const historyEntry = { 
            url: selectedPhoto.processedUrl || selectedPhoto.blobUrl, 
            date: new Date().toISOString(), 
            label: `Crop v${selectedPhoto.version}` 
          };
          
          updatePhoto(selectedPhotoId, {
            processedUrl: url,
            version: selectedPhoto.version + 1,
            history: [...selectedPhoto.history, historyEntry]
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
      const resp = await fetch(photo.processedUrl || photo.blobUrl);
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/enhance', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }) 
      });
      
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let msg = 'Enhancement failed';
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          msg = err.error || msg;
        }
        throw new Error(msg);
      }

      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.url) {
          updatePhoto(id, { 
            processedUrl: data.url, 
            version: photo.version + 1,
            history: [...photo.history, { url: photo.processedUrl || photo.blobUrl, date: new Date().toISOString(), label: 'AI Enhanced' }]
          });
        }
      } else {
        throw new Error('Server returned invalid format');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBg = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    setIsProcessing(true);
    try {
      const resp = await fetch(photo.processedUrl || photo.blobUrl);
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/remove-bg', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'X-User-Api-Key': userApiKey } : {})
        },
        body: JSON.stringify({ image: base64 })
      });

      const contentType = res.headers.get('content-type');
      if (res.status === 400) {
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          if (err.code === 'LIMIT_REACHED') {
            setShowApiModal(true);
            setIsProcessing(false);
            return;
          }
        }
      }

      if (!res.ok) {
        let msg = 'Remove BG failed';
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          msg = err.error || msg;
        }
        throw new Error(msg);
      }

      const processedBlob = await res.blob();
      if (!processedBlob.type.startsWith('image/')) {
        throw new Error('Server did not return an image');
      }
      const url = URL.createObjectURL(processedBlob);
      await savePhotoBlob(id, processedBlob);
      updatePhoto(id, { 
        processedUrl: url, 
        version: photo.version + 1,
        history: [...photo.history, { url: photo.processedUrl || photo.blobUrl, date: new Date().toISOString(), label: 'BG Removed' }]
      });
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PDF GENERATION ---
  const generatePDF = async () => {
    setIsProcessing(true);
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const A4_W = 210;
        const A4_H = 297;
        const width = prefs.defaultWidth;
        const height = prefs.defaultHeight;
        const spacing = prefs.spacing;
        const margin = prefs.margin;

        // Calculate layout
        const availW = A4_W - (margin * 2);
        const cols = Math.floor((availW + spacing) / (width + spacing));
        const rowsPerPage = Math.floor((A4_H - (margin * 2) + spacing) / (height + spacing));
        const perPage = cols * rowsPerPage;

        let totalUsed = 0;
        let pIndex = 0;

        while (totalUsed < totalCopies) {
            if (pIndex > 0) doc.addPage();
            
            const countOnPage = Math.min(perPage, totalCopies - totalUsed);
            for (let i = 0; i < countOnPage; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const x = margin + col * (width + spacing);
                const y = margin + row * (height + spacing);

                // Use current selected photo or cycle?
                const photoItem = photos.find(p => p.id === selectedPhotoId) || photos[0];
                const finalBlob = await getPhotoBlob(photoItem.id);
                const imgBlob = finalBlob || await (await fetch(photoItem.processedUrl || photoItem.blobUrl)).blob();
                
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(imgBlob);
                });
                doc.addImage(base64, 'JPEG', x, y, width, height, undefined, 'FAST');
                totalUsed++;
            }
            pIndex++;
        }

        doc.save(`Yugual_Print_${Date.now()}.pdf`);
    } catch (err) {
        console.error("PDF Gen failed:", err);
    } finally {
        setIsProcessing(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(photos.map(p => p.category))).filter(c => c !== 'All')];
  const filteredPhotos = photos.filter(p => {
    const matchesSearch = p.originalName.toLowerCase().includes(searchTerm.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!appStarted && photos.length === 0) return <LandingPage onStart={() => setAppStarted(true)} />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-ios-blue/30 transition-colors duration-300 pb-20 md:pb-0">
      
      {/* HEADER */}
      <header className={cn("sticky top-0 z-[60] px-6 py-4 flex items-center justify-between", UI.glass)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ios-blue rounded-xl flex items-center justify-center shadow-lg shadow-ios-blue/20">
            <Zap className="text-white w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">YUGAL</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono tracking-widest uppercase">Passport Engine • V3</p>
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
            onClick={() => startCamera()}
            className="p-2.5 rounded-full bg-ios-blue text-white shadow-lg shadow-ios-blue/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        
        {/* SIDEBAR (DESKTOP) / HORIZONTAL NAV (MOBILE) */}
        <aside className="w-full md:w-80 p-6 space-y-8 border-r border-[var(--separator)] bg-[var(--bg-secondary)] hidden md:block">
           <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-ios-blue transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search moments..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-tertiary)] px-2">Collections</h4>
                 <div className="flex flex-col gap-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          filterCategory === cat 
                            ? "bg-ios-blue text-white shadow-lg shadow-ios-blue/20" 
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                        )}
                      >
                        {cat}
                        <ChevronRight className={cn("w-4 h-4", filterCategory === cat ? "opacity-100" : "opacity-0")} />
                      </button>
                    ))}
                 </div>
              </div>

              <div className={cn("space-y-4", UI.card, "p-6")}>
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-ios-blue">Device Status</h4>
                    <div className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-xs font-medium">Local DB Active</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
                       <div className="w-[12%] h-full bg-ios-green rounded-full" />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Using 12.4 MB of 2.1 GB</p>
                 </div>
              </div>
           </div>
        </aside>

        {/* MAIN FEED */}
        <main className="flex-1 p-6 space-y-8">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                 <h2 className="text-3xl font-bold tracking-tight">Gallery</h2>
                 <p className="text-[var(--text-tertiary)] text-sm">Review and edit your local sessions.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn("flex-1 md:flex-none", UI.btnSecondary)}
                 >
                   <Upload className="w-4 h-4" />
                   Import
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
                 <button onClick={() => setIsSettingsOpen(true)} className={cn("flex-1 md:flex-none", UI.btnSecondary)}>
                   <Settings className="w-4 h-4" />
                 </button>
              </div>
           </div>

           <AnimatePresence mode="popLayout">
             {filteredPhotos.length === 0 ? (
               <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
               >
                 <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                    <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
                 </div>
                 <h3 className="text-xl font-bold">No Photos Found</h3>
                 <p className="text-[var(--text-tertiary)] max-w-xs mx-auto mt-2">Try searching for something else or upload new photos.</p>
               </motion.div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group relative transition-all active:scale-[0.98] cursor-pointer",
                        UI.card,
                        selectedPhotoId === photo.id && "ring-2 ring-ios-blue ring-offset-4 ring-offset-[var(--bg-primary)]"
                      )}
                      onClick={() => setSelectedPhotoId(photo.id)}
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-black/5">
                        <img 
                          src={photo.processedUrl || photo.blobUrl} 
                          alt="Portrait" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-3 bg-[var(--bg-secondary)] flex items-center justify-between">
                         <div className="min-w-0">
                           <p className="text-[11px] font-bold truncate opacity-80">{photo.originalName}</p>
                           <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold">v{photo.version} • {photo.width}x{photo.height}mm</p>
                         </div>
                         <CheckCircle2 className="w-4 h-4 text-ios-green shrink-0" fill="currentColor" />
                      </div>
                    </motion.div>
                  ))}
               </div>
             )}
           </AnimatePresence>
        </main>
      </div>

      {/* FLOATING ACTION BAR (MOBILE) */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
          >
            <div className={cn("p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4", UI.glass)}>
               <div className="flex-1 flex flex-col pl-4">
                  <span className="text-[9px] font-bold text-ios-blue uppercase tracking-widest mb-1">Batch Setup</span>
                  <div className="flex items-center gap-4">
                     <button 
                      onClick={() => setTotalCopies(Math.max(1, totalCopies - 1))}
                      className="w-8 h-8 rounded-full bg-[var(--bg-primary)] flex items-center justify-center font-bold"
                     > - </button>
                     <span className="text-xl font-bold">{totalCopies}</span>
                     <button 
                      onClick={() => setTotalCopies(totalCopies + 1)}
                      className="w-8 h-8 rounded-full bg-[var(--bg-primary)] flex items-center justify-center font-bold"
                     > + </button>
                  </div>
               </div>
               <button 
                onClick={generatePDF}
                disabled={isProcessing}
                className="h-14 px-8 rounded-full bg-ios-blue text-white font-bold flex items-center gap-3 shadow-lg shadow-ios-blue/30 disabled:opacity-50 transition-all active:scale-95"
               >
                 {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                 <span>Export Sheets</span>
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHOTO PREVIEW / EDITOR DRAWER */}
      <AnimatePresence>
        {selectedPhoto && !isCropping && !isCameraActive && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhotoId(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] hidden md:block"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className={cn("fixed inset-y-0 right-0 z-[80] w-full md:w-[450px] bg-[var(--bg-secondary)] shadow-2xl flex flex-col border-l border-[var(--separator)]", UI.glass)}
            >
               <div className="p-6 border-b border-[var(--separator)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setSelectedPhotoId(null)} className="p-2 -ml-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                     </button>
                     <h3 className="text-xl font-bold">Metadata</h3>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => deletePhoto(selectedPhoto.id)} className="p-2 text-ios-red hover:bg-ios-red/5 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                  <div className={cn("aspect-[3/4] group relative", UI.card)}>
                     <img src={selectedPhoto.processedUrl || selectedPhoto.blobUrl} className="w-full h-full object-cover" />
                     <button 
                        onClick={() => setIsCropping(true)}
                        className="absolute bottom-4 right-4 p-4 bg-white/90 backdrop-blur-md text-black rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm active:scale-95"
                     >
                        <Crop className="w-4 h-4" />
                        Edit Crop
                     </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                     <button 
                      onClick={() => handleEnhance(selectedPhoto.id)}
                      className={UI.btnPrimary}
                     >
                        <Zap className="w-6 h-6" fill="currentColor" />
                        AI Enhancement
                     </button>
                     <button 
                      onClick={() => handleRemoveBg(selectedPhoto.id)}
                      className={cn(UI.btnSecondary, "!bg-ios-green/5 !border-ios-green/20 !text-ios-green")}
                     >
                        <Filter className="w-6 h-6" />
                        Remove Background
                     </button>
                  </div>

                  {/* SLIDERS */}
                  <div className="space-y-6">
                     <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Visual Adjustments</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                              <span>Brightness</span>
                              <span>{selectedPhoto.filters.brightness}%</span>
                           </div>
                           <input 
                            type="range" min="50" max="150" value={selectedPhoto.filters.brightness}
                            onChange={(e) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, brightness: parseInt(e.target.value) }})}
                            className="w-full accent-ios-blue h-1.5 bg-[var(--separator)] rounded-full appearance-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                              <span>Contrast</span>
                              <span>{selectedPhoto.filters.contrast}%</span>
                           </div>
                           <input 
                            type="range" min="50" max="150" value={selectedPhoto.filters.contrast}
                            onChange={(e) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, contrast: parseInt(e.target.value) }})}
                            className="w-full accent-ios-blue h-1.5 bg-[var(--separator)] rounded-full appearance-none"
                           />
                        </div>
                     </div>
                  </div>

                  {/* CATEGORY & TAGS */}
                  <div className="space-y-4">
                     <div className="ios-card p-4 space-y-3">
                       <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest block">Session Collection</label>
                       <select 
                         value={selectedPhoto.category}
                         onChange={(e) => updatePhoto(selectedPhoto.id, { category: e.target.value })}
                         className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue appearance-none"
                       >
                         {['Recent', 'Work', 'Travel', 'Biometric', 'IDs'].map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
                  </div>
               </div>

               <div className="p-6 border-t border-[var(--separator)] flex gap-3">
                  <button 
                    onClick={() => setSelectedPhotoId(null)}
                    className="flex-1 ios-button-secondary py-4"
                  >
                    Done
                  </button>
                  <button className="ios-button-secondary p-4">
                    <Share2 className="w-5 h-5" />
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CAMERA MODAL */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6"
          >
            <div className="absolute top-8 inset-x-8 flex items-center justify-between z-10">
               <button onClick={stopCamera} className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white">
                 <X className="w-6 h-6" />
               </button>
               <div className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest border border-white/20">
                 Pro Portrait Lens
               </div>
               <div className="w-12 h-12" />
            </div>
            
            <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden rounded-[40px]">
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
               />
               <canvas ref={canvasRef} className="hidden" />
               
               {/* GUIDES */}
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[85%] max-w-[300px] aspect-[3/4] border-2 border-white/30 rounded-[4rem] relative">
                      <div className="absolute top-[25%] inset-x-0 h-px bg-white/10" />
                      <div className="absolute top-[50%] inset-x-0 h-px bg-white/10" />
                      <div className="absolute top-[75%] inset-x-0 h-px bg-white/10" />
                      <div className="absolute inset-x-0 bottom-4 flex justify-center">
                        <div className="px-3 py-1 bg-white/50 backdrop-blur-md rounded-full text-[8px] font-bold text-black border border-white/20">ALIGN SHOULDERS HERE</div>
                      </div>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-8">
               <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform p-1 shadow-2xl"
               >
                 <div className="w-full h-full rounded-full bg-white" />
               </button>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Self-timer: Off • Flash: Auto</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CROP MODAL */}
      <AnimatePresence>
        {isCropping && selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[200] ios-glass flex items-center justify-center p-4"
          >
            <div className="bg-[var(--bg-secondary)] rounded-[3rem] overflow-hidden max-w-4xl w-full flex flex-col h-[90vh] shadow-2xl border border-[var(--separator)]">
               <div className="p-8 border-b border-[var(--separator)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                     <h2 className="text-2xl font-bold">Biometric Fitting</h2>
                     <p className="text-[10px] text-ios-blue font-bold uppercase tracking-widest mt-1">Preset: {prefs.defaultWidth}x{prefs.defaultHeight}mm Passport</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-[var(--bg-primary)] rounded-full font-bold text-sm">Cancel</button>
                     <button onClick={applyCrop} className="px-6 py-2 bg-ios-blue text-white rounded-full font-bold text-sm shadow-lg shadow-ios-blue/20">Apply & Save</button>
                  </div>
               </div>

               <div className="flex-1 bg-black/5 flex items-center justify-center overflow-hidden p-8">
                  <div className="w-full h-full max-h-[60vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <Cropper
                      src={selectedPhoto.blobUrl}
                      style={{ height: '100%', width: '100%' }}
                      aspectRatio={prefs.defaultWidth / prefs.defaultHeight}
                      guides={true}
                      ref={cropperRef}
                      viewMode={1}
                      background={false}
                      dragMode="move"
                    />
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADER */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] ios-glass flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-[6px] border-ios-blue/10 border-t-ios-blue rounded-full" 
              />
              <Zap className="absolute inset-0 m-auto text-ios-blue w-8 h-8" fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold mb-2">Architecting Document</h3>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-[0.3em] font-mono">Micro-DPI Scaling Engine Active</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API MODAL */}
      <AnimatePresence>
        {showApiModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] ios-glass flex items-center justify-center p-6"
          >
            <div className={cn("p-8 max-w-sm w-full space-y-6", UI.card)}>
               <div className="w-16 h-16 bg-ios-red/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="text-ios-red w-8 h-8" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-bold">Limit Reached</h3>
                 <p className="text-sm text-[var(--text-secondary)]">Please enter your personal Remove.bg API key to continue. It stays on your device.</p>
               </div>
               <input 
                  type="text" 
                  value={userApiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserApiKey(val);
                    localStorage.setItem('user_remove_bg_key', val);
                  }}
                  placeholder="Paste API Key..."
                  className="w-full p-4 rounded-xl border border-[var(--separator)] bg-[var(--bg-primary)] text-sm focus:ring-2 focus:ring-ios-blue focus:outline-none"
               />
               <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowApiModal(false)} className="flex-1 py-4 bg-[var(--bg-primary)] rounded-xl font-bold text-sm">Dismiss</button>
                  <button onClick={() => setShowApiModal(false)} className="flex-1 py-4 bg-ios-blue text-white rounded-xl font-bold text-sm">Save Key</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS DRAWER */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[400]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 z-[410] w-full md:w-[450px] bg-[var(--bg-secondary)] shadow-2xl flex flex-col border-l border-[var(--separator)] ios-glass"
            >
               <div className="p-8 border-b border-[var(--separator)] flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Print Configuration</h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-10">
                  <section className="space-y-6">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-ios-blue">Tiling Options</h4>
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60">
                              <span>Exact Copies</span>
                              <span className="text-ios-blue">{totalCopies}</span>
                           </div>
                           <input 
                              type="range" min="1" max="100" value={totalCopies}
                              onChange={(e) => setTotalCopies(parseInt(e.target.value))}
                              className="w-full h-2 bg-[var(--separator)] rounded-full appearance-none accent-ios-blue"
                           />
                           <input 
                              type="number" value={totalCopies}
                              onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-xl p-4 text-lg font-bold"
                           />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Spacing (mm)</label>
                              <input 
                                 type="number" value={prefs.spacing}
                                 onChange={(e) => setPrefs({...prefs, spacing: parseInt(e.target.value) || 0})}
                                 className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-xl p-4 font-bold"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Margins (mm)</label>
                              <input 
                                 type="number" value={prefs.margin}
                                 onChange={(e) => setPrefs({...prefs, margin: parseInt(e.target.value) || 0})}
                                 className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-xl p-4 font-bold"
                              />
                           </div>
                        </div>
                     </div>
                  </section>

                  <section className="space-y-6">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-ios-blue">Print Quality</h4>
                     <div className="p-6 bg-ios-blue/5 rounded-[2rem] border border-ios-blue/10">
                        <p className="text-sm leading-relaxed mb-4">You are currently using <strong>High-Density</strong> mode. Images will be sampled at their native resolution for maximum sharpness.</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ios-blue">
                           <CheckCircle2 className="w-4 h-4" />
                           300+ DPI Certified
                        </div>
                     </div>
                  </section>
               </div>

               <div className="p-8 border-t border-[var(--separator)] bg-[var(--bg-primary)]">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full py-5 bg-ios-blue text-white rounded-2xl font-bold tracking-wide shadow-xl shadow-ios-blue/20"
                  >
                    Confirm Settings
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
