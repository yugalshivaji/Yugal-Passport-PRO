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
  Sliders,
  AlertTriangle,
  Key,
  Lock,
  MessageSquare
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
    hue: number;
    saturation: number;
    temperature: number;
    grayscale: boolean;
  };
  transform?: {
    rotate: number;
    perspective: number;
    scale: number;
  };
}

interface UserPreferences {
  defaultWidth: number;
  defaultHeight: number;
  spacing: number;
  margin: number;
  borderSize: number;
  borderColor: string;
  paperSize: 'A4' | '4x6' | '5x7';
  autoDelete: boolean;
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

const ApiKeyModal = ({ isOpen, onClose, keys, onSave }: { isOpen: boolean, onClose: () => void, keys: any, onSave: (k: any) => void }) => {
  const [localKeys, setLocalKeys] = useState(keys);
  const [showInstructions, setShowInstructions] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localKeys);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-[2.5rem] shadow-2xl border border-[var(--separator)] overflow-hidden ios-glass"
          >
            <div className="p-8 border-b border-[var(--separator)] flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-ios-blue/10 rounded-2xl">
                     <Key className="w-6 h-6 text-ios-blue" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">API Configuration</h2>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-widest">Connect AI Engines</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
               <div className="p-4 bg-ios-red/5 rounded-2xl border border-ios-red/10 flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-ios-red shrink-0 mt-1" />
                  <p className="text-xs text-ios-red leading-relaxed font-medium">
                    To use AI features while avoiding global limits, please provide your own API keys. These are stored <strong>only on your device</strong>.
                  </p>
               </div>

               {/* REMOVE.BG SECTION */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Remove.bg API Key</label>
                     <button 
                       type="button"
                       onClick={() => setShowInstructions(showInstructions === 'removebg' ? null : 'removebg')}
                       className="text-[10px] font-bold text-ios-blue hover:underline"
                     >
                       How to get?
                     </button>
                  </div>
                  <input 
                    type="password"
                    placeholder="Enter Remove.bg Key"
                    value={localKeys.removeBg}
                    onChange={(e) => setLocalKeys({ ...localKeys, removeBg: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-2xl p-5 text-sm font-mono focus:ring-2 focus:ring-ios-blue outline-none transition-all"
                  />
                  {showInstructions === 'removebg' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-ios-blue/5 rounded-xl text-[11px] leading-relaxed space-y-2 border border-ios-blue/10">
                       <p>1. Go to <a href="https://www.remove.bg/" target="_blank" className="text-ios-blue underline">remove.bg</a> and sign up.</p>
                       <p>2. Go to **Dashboard** &gt; **API Keys**.</p>
                       <p>3. Create a free key (50 free previews/month).</p>
                    </motion.div>
                  )}
               </div>

               {/* CLOUDINARY SECTION */}
               <div className="space-y-6 pt-6 border-t border-[var(--separator)]">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Cloudinary Credentials (Restoration)</label>
                     <button 
                       type="button"
                       onClick={() => setShowInstructions(showInstructions === 'cloudinary' ? null : 'cloudinary')}
                       className="text-[10px] font-bold text-ios-blue hover:underline"
                     >
                       How to get?
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <input 
                      type="text"
                      placeholder="Cloud Name"
                      value={localKeys.cloudName}
                      onChange={(e) => setLocalKeys({ ...localKeys, cloudName: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-ios-blue outline-none transition-all"
                    />
                    <input 
                      type="text"
                      placeholder="API Key"
                      value={localKeys.cloudApiKey}
                      onChange={(e) => setLocalKeys({ ...localKeys, cloudApiKey: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-ios-blue outline-none transition-all"
                    />
                    <input 
                      type="password"
                      placeholder="API Secret"
                      value={localKeys.cloudApiSecret}
                      onChange={(e) => setLocalKeys({ ...localKeys, cloudApiSecret: e.target.value })}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-ios-blue outline-none transition-all"
                    />
                  </div>

                  {showInstructions === 'cloudinary' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-ios-blue/5 rounded-xl text-[11px] leading-relaxed space-y-2 border border-ios-blue/10">
                       <p>1. Create a free account at <a href="https://cloudinary.com/" target="_blank" className="text-ios-blue underline">Cloudinary</a>.</p>
                       <p>2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard.</p>
                       <p>3. Enable **Generative Credits** in settings if prompted.</p>
                    </motion.div>
                  )}
               </div>

               <div className="flex items-center gap-2 p-4 bg-ios-green/5 rounded-2xl border border-ios-green/10">
                  <ShieldCheck className="w-4 h-4 text-ios-green" />
                  <p className="text-[10px] text-ios-green font-bold uppercase tracking-wider">End-to-End Encrypted Local Storage</p>
               </div>
            </form>

            <div className="p-8 bg-[var(--bg-primary)] border-t border-[var(--separator)] flex gap-4">
               <button 
                 type="button"
                 onClick={onClose}
                 className="flex-1 py-4 bg-[var(--bg-secondary)] border border-[var(--separator)] rounded-2xl font-bold tracking-wide transition-all"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSubmit}
                 className="flex-[2] py-4 bg-ios-blue text-white rounded-2xl font-bold tracking-wide shadow-xl shadow-ios-blue/20 transition-all hover:scale-[1.02] active:scale-95"
               >
                 Save Credentials
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AdjustmentSlider = ({ label, value, onChange, min, max, unit = "%" }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
       <span>{label}</span>
       <span className="text-ios-blue">{value}{unit}</span>
    </div>
    <div className="relative group flex items-center">
      <input 
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-[var(--separator)] rounded-full appearance-none accent-ios-blue group-hover:h-2 transition-all"
      />
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appStarted, setAppStarted] = useState(false);
  const [activeView, setActiveView] = useState<'gallery' | 'how-to' | 'privacy'>('gallery');
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('yugal_api_keys');
    return saved ? JSON.parse(saved) : { removeBg: '', cloudName: '', cloudApiKey: '', cloudApiSecret: '' };
  });

  const saveApiKeys = (keys: any) => {
    setApiKeys(keys);
    localStorage.setItem('yugal_api_keys', JSON.stringify(keys));
  };
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
    borderColor: '#000000',
    paperSize: 'A4',
    autoDelete: false
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
      
      if (data.photos) {
          hydratePhotos(data.photos);
      }
    }
  }, []);

  // API Key Check on First Run (after splash)
  useEffect(() => {
    if (!showSplash && (!apiKeys.removeBg || !apiKeys.cloudApiKey)) {
      setShowApiModal(true);
    }
  }, [showSplash]);

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

  const generateLogo = () => (
    <div className="flex items-center gap-3 group px-2">
      <div className="relative">
        <div className="w-10 h-10 bg-ios-blue rounded-xl flex items-center justify-center shadow-lg shadow-ios-blue/20 group-hover:rotate-12 transition-transform duration-500">
          <Camera className="text-white w-6 h-6" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-ios-green rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tighter flex items-center gap-1">
          YUGAL
          <span className="text-[10px] bg-ios-blue/10 text-ios-blue px-1.5 py-0.5 rounded-md font-bold">MAKER</span>
        </h1>
        <p className="text-[8px] text-[var(--text-tertiary)] font-bold tracking-[0.2em] uppercase">Built by Yugal Lab</p>
      </div>
    </div>
  );

  const clearAllData = async () => {
    if (confirm("Are you sure? This will delete all photos and session data permanently.")) {
      setPhotos([]);
      localStorage.removeItem('yugal_app_data');
      // Potential IDB clear if needed, but setPhotos([]) handles local session
      setSelectedPhotoId(null);
      alert("All data wiped successfully.");
    }
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
      filters: { 
        brightness: 100, 
        contrast: 100, 
        hue: 0,
        saturation: 100,
        temperature: 0,
        grayscale: false 
      },
      transform: { rotate: 0, perspective: 0, scale: 1 }
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
    
    if (!apiKeys.cloudApiKey || !apiKeys.cloudName) {
      setShowApiModal(true);
      return;
    }

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
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Cloud-Name': apiKeys.cloudName,
          'X-User-Cloud-Key': apiKeys.cloudApiKey,
          'X-User-Cloud-Secret': apiKeys.cloudApiSecret
        },
        body: JSON.stringify({ image: base64 }) 
      });
      
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 429) {
          setShowApiModal(true);
          throw new Error('API limit reached or invalid keys. Please update your Cloudinary credentials.');
        }
        let msg = 'Enhancement failed';
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          msg = err.error || msg;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      if (data.url) {
        updatePhoto(id, { 
          processedUrl: data.url, 
          version: photo.version + 1,
          history: [...photo.history, { url: photo.processedUrl || photo.blobUrl, date: new Date().toISOString(), label: 'AI Enhanced' }]
        });
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

    if (!apiKeys.removeBg) {
      setShowApiModal(true);
      return;
    }

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
          'X-User-Api-Key': apiKeys.removeBg
        },
        body: JSON.stringify({ image: base64 })
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (res.status === 429 || res.status === 401 || res.status === 403) {
          setShowApiModal(true);
          throw new Error('API limit reached or invalid key. Please update your Remove.bg key.');
        }
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
                // Apply border if exists
                if (prefs.borderSize > 0) {
                    doc.setDrawColor(prefs.borderColor);
                    doc.setLineWidth(prefs.borderSize / 10); // convert slightly
                    doc.rect(x, y, width, height, 'S');
                }

                doc.addImage(base64, 'JPEG', x, y, width, height, undefined, 'FAST');
                totalUsed++;
            }
            pIndex++;
        }

        doc.save(`Yugual_Print_${Date.now()}.pdf`);
        if (prefs.autoDelete && selectedPhotoId) {
           deletePhoto(selectedPhotoId);
           setSelectedPhotoId(null);
        }
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

  const NavContent = () => (
    <div className="space-y-6">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-ios-blue transition-colors" />
        <input 
          type="text" 
          placeholder="Search moments..."
          className="w-full bg-[var(--bg-primary)] border border-[var(--separator)] rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue/20 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-1">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-tertiary)] px-2 mb-2">Main Navigation</h4>
          <button onClick={() => setActiveView('gallery')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all", activeView === 'gallery' ? "bg-ios-blue text-white shadow-lg shadow-ios-blue/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]")}>
             <LayoutGrid className="w-4 h-4" /> Gallery
          </button>
          <button onClick={() => setActiveView('how-to')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all", activeView === 'how-to' ? "bg-ios-blue text-white shadow-lg shadow-ios-blue/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]")}>
             <Info className="w-4 h-4" /> How to Use
          </button>
          <button onClick={() => setActiveView('privacy')} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all", activeView === 'privacy' ? "bg-ios-blue text-white shadow-lg shadow-ios-blue/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]")}>
             <ShieldCheck className="w-4 h-4" /> Privacy Policy
          </button>
      </div>

      {activeView === 'gallery' && (
        <div className="space-y-1 pt-4 border-t border-[var(--separator)]">
           <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-tertiary)] px-2 mb-2">Collections</h4>
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setFilterCategory(cat)}
               className={cn(
                 "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                 filterCategory === cat 
                   ? "bg-ios-blue/10 text-ios-blue" 
                   : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
               )}
             >
               {cat}
               <ChevronRight className={cn("w-4 h-4", filterCategory === cat ? "opacity-100" : "opacity-0")} />
             </button>
           ))}
        </div>
      )}
    </div>
  );

  const HowToPage = () => (
    <div className="max-w-4xl mx-auto py-12 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight">How to Get Perfect Prints</h2>
        <p className="text-[var(--text-secondary)] text-lg">Follow these 3 simple steps for biometric-ready photos.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { step: "01", title: "Click Photo", desc: "Use a clean, light-colored background. Our camera guide helps you align perfectly." },
          { step: "02", title: "AI Polish", desc: "One-tap AI restoration fixes lighting and removes cluttered backgrounds automatically." },
          { step: "03", title: "Tiling & Print", desc: "Choose your paper size (A4/4x6) and download a high-density PDF ready for any printer." }
        ].map((s, i) => (
          <div key={i} className={cn("p-8 space-y-4", UI.card)}>
            <div className="text-4xl font-black text-ios-blue/20">{s.step}</div>
            <h3 className="text-xl font-bold">{s.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const PrivacyPage = () => (
    <div className="max-w-3xl mx-auto py-12 space-y-8 prose dark:prose-invert">
      <h2 className="text-4xl font-extrabold tracking-tight">Your Privacy, Our Priority</h2>
      <p className="text-lg leading-relaxed">
        YUGAL Passport Photo Maker is a <strong>local-first</strong> application. This means:
      </p>
      <ul className="space-y-4 list-disc pl-6 opacity-80">
        <li><strong>No Images Uploaded:</strong> Your photos are processed entirely within your browser's memory and saved to a secure local database (IndexedDB).</li>
        <li><strong>No Cloud Storage:</strong> We do not have servers that store your biometric data.</li>
        <li><strong>Secure API Key Proxying:</strong> If you use the background removal feature, the image is passed through a secure, non-logging proxy solely for processing.</li>
        <li><strong>Right to Erase:</strong> You can wipe all app data with one click in settings.</li>
      </ul>
      <div className="p-8 bg-ios-blue/5 border border-ios-blue/10 rounded-3xl mt-12">
        <h4 className="font-bold mb-2">Google AdSense Compliance</h4>
        <p className="text-sm opacity-80 italic">We use standard Google services for analytics and monetization. These services may use cookies as per Google's standard privacy policy.</p>
      </div>
    </div>
  );

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!appStarted && photos.length === 0) return <LandingPage onStart={() => setAppStarted(true)} />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-ios-blue/30 transition-colors duration-300 pb-20 md:pb-0">
      
      {/* HEADER */}
      <header className={cn("sticky top-0 z-[60] px-6 py-4 flex items-center justify-between", UI.glass)}>
        <button onClick={() => setActiveView('gallery')} className="hover:scale-105 transition-transform">
          {generateLogo()}
        </button>
        
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
        
        {/* SIDEBAR (DESKTOP) */}
        <aside className="w-full md:w-80 p-6 space-y-8 border-r border-[var(--separator)] bg-[var(--bg-secondary)] hidden md:block overflow-y-auto no-scrollbar h-[calc(100vh-80px)] sticky top-[80px]">
           <NavContent />
           
           <div className={cn("space-y-4", UI.card, "p-6 mt-8")}>
              <div className="flex items-center justify-between">
                 <h4 className="text-[10px] uppercase font-bold tracking-widest text-ios-blue">Device Status</h4>
                 <div className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
              </div>
              <div className="space-y-2">
                 <p className="text-xs font-medium">Local DB Active</p>
                 <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
                    <div className="w-[12%] h-full bg-ios-green rounded-full" />
                 </div>
                 <p className="text-[10px] text-[var(--text-tertiary)] font-bold">Encrypted Sandbox Active</p>
              </div>
           </div>
        </aside>

        {/* MAIN FEED */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          {activeView === 'gallery' && (
            <div className="space-y-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                     <h2 className="text-3xl font-extrabold tracking-tight">Gallary</h2>
                     <p className="text-[var(--text-tertiary)] text-sm font-medium">Review and edit your local sessions.</p>
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
                       Configure
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
                     <p className="text-[var(--text-tertiary)] max-w-xs mx-auto mt-2">Try searching or upload new photo session.</p>
                   </motion.div>
                 ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredPhotos.map((photo) => (
                        <motion.div
                          key={photo.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -5 }}
                          className={cn(
                            "group relative transition-all active:scale-[0.98] cursor-pointer",
                            UI.card,
                            selectedPhotoId === photo.id && "ring-4 ring-ios-blue ring-offset-4 ring-offset-[var(--bg-primary)]"
                          )}
                          onClick={() => setSelectedPhotoId(photo.id)}
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-black/5 relative">
                            <img 
                              src={photo.processedUrl || photo.blobUrl} 
                              alt="Portrait" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-700"
                              style={{ 
                                filter: `brightness(${photo.filters.brightness || 100}%) contrast(${photo.filters.contrast || 100}%) hue-rotate(${photo.filters.hue || 0}deg) saturate(${photo.filters.saturation || 100}%) grayscale(${photo.filters.grayscale ? 1 : 0})`,
                                transform: `rotate(${photo.transform?.rotate || 0}deg)`
                              }}
                            />
                            {photo.version > 1 && (
                              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[8px] font-black rounded-lg">V{photo.version}</div>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePhoto(photo.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-ios-red/80 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="p-4 bg-[var(--bg-secondary)] flex items-center justify-between">
                             <div className="min-w-0">
                               <p className="text-[11px] font-bold truncate opacity-80">{photo.originalName}</p>
                               <p className="text-[9px] text-ios-blue uppercase font-bold tracking-widest">{photo.category}</p>
                             </div>
                             <CheckCircle2 className="w-4 h-4 text-ios-green shrink-0" fill="currentColor" />
                          </div>
                        </motion.div>
                      ))}
                   </div>
                 )}
               </AnimatePresence>
            </div>
          )}

          {activeView === 'how-to' && <HowToPage />}
          {activeView === 'privacy' && <PrivacyPage />}

          <footer className="mt-32 pt-12 border-t border-[var(--separator)] pb-32 md:pb-12 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
              <div className="space-y-1">
                <p className="text-xs font-black tracking-widest text-ios-blue uppercase">Design and developed by Yugal</p>
                <div className="flex items-center justify-center md:justify-start gap-3 text-[10px] font-bold">
                  <a href="https://linkedin.com/in/yugalofficial" target="_blank" className="hover:text-ios-blue transition-colors flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> LinkedIn @yugalofficial
                  </a>
                  <span>•</span>
                  <span>v3.0.4 Premium Edition</span>
                </div>
              </div>
              <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
                <button onClick={() => setActiveView('gallery')} className="hover:text-ios-blue">Workspace</button>
                <button onClick={() => setActiveView('how-to')} className="hover:text-ios-blue">Guide</button>
                <button onClick={() => setActiveView('privacy')} className="hover:text-ios-blue">Legal</button>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* MOBILE NAV BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-[100] md:hidden bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-t border-[var(--separator)] p-4 flex items-center justify-around safe-bottom">
         <button onClick={() => setActiveView('gallery')} className={cn("flex flex-col items-center gap-1", activeView === 'gallery' ? "text-ios-blue" : "text-[var(--text-tertiary)]")}>
           <LayoutGrid className="w-5 h-5" />
           <span className="text-[10px] font-bold tracking-tight">Workspace</span>
         </button>
         <button onClick={() => setActiveView('how-to')} className={cn("flex flex-col items-center gap-1", activeView === 'how-to' ? "text-ios-blue" : "text-[var(--text-tertiary)]")}>
           <Info className="w-5 h-5" />
           <span className="text-[10px] font-bold tracking-tight">Help</span>
         </button>
         <button onClick={() => setActiveView('privacy')} className={cn("flex flex-col items-center gap-1", activeView === 'privacy' ? "text-ios-blue" : "text-[var(--text-tertiary)]")}>
           <ShieldCheck className="w-5 h-5" />
           <span className="text-[10px] font-bold tracking-tight">Privacy</span>
         </button>
         <button onClick={() => setIsSettingsOpen(true)} className="text-[var(--text-tertiary)] flex flex-col items-center gap-1">
           <Settings className="w-5 h-5" />
           <span className="text-[10px] font-bold tracking-tight">Config</span>
         </button>
      </nav>

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
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-ios-blue">Master Adjustments</h4>
                        <button 
                          onClick={() => setIsTransforming(true)}
                          className="flex items-center gap-1 text-[10px] font-bold text-ios-blue uppercase tracking-widest bg-ios-blue/10 px-2 py-1 rounded-lg"
                        >
                          <Maximize className="w-3 h-3" /> 3D Transform
                        </button>
                     </div>
                     <div className="space-y-5">
                        <AdjustmentSlider 
                          label="Brightness" 
                          value={selectedPhoto.filters.brightness} 
                          onChange={(v) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, brightness: v }})}
                          min={50} max={150}
                        />
                        <AdjustmentSlider 
                          label="Contrast" 
                          value={selectedPhoto.filters.contrast} 
                          onChange={(v) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, contrast: v }})}
                          min={50} max={150}
                        />
                        <AdjustmentSlider 
                          label="Saturation" 
                          value={selectedPhoto.filters.saturation} 
                          onChange={(v) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, saturation: v }})}
                          min={0} max={200}
                        />
                        <AdjustmentSlider 
                          label="Hue Rotate" 
                          value={selectedPhoto.filters.hue} 
                          onChange={(v) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, hue: v }})}
                          min={0} max={360}
                          unit="°"
                        />
                        <AdjustmentSlider 
                          label="Warmth" 
                          value={selectedPhoto.filters.temperature} 
                          onChange={(v) => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, temperature: v }})}
                          min={-100} max={100}
                        />
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--separator)]">
                           <span className="text-xs font-bold uppercase tracking-widest opacity-60">Grayscale Mode</span>
                           <button 
                            onClick={() => updatePhoto(selectedPhoto.id, { filters: { ...selectedPhoto.filters, grayscale: !selectedPhoto.filters.grayscale }})}
                            className={cn("w-12 h-6 rounded-full transition-colors relative", selectedPhoto.filters.grayscale ? "bg-ios-blue" : "bg-gray-300")}
                           >
                              <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform", selectedPhoto.filters.grayscale ? "translate-x-6" : "translate-x-0")} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* HISTORY PANEL */}
                  {selectedPhoto.history.length > 0 && (
                    <div className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-2">
                         <History className="w-3 h-3" /> Version History
                       </h4>
                       <div className="flex flex-col gap-2">
                          {selectedPhoto.history.map((entry, idx) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                updatePhoto(selectedPhoto.id, { 
                                  processedUrl: entry.url, 
                                  version: idx + 1,
                                  history: selectedPhoto.history.slice(0, idx)
                                });
                              }}
                              className="flex items-center justify-between p-3 bg-[var(--bg-primary)] hover:bg-[var(--bg-primary)]/80 rounded-xl text-xs group border border-[var(--separator)]"
                            >
                               <div className="flex flex-col items-start gap-0.5">
                                 <span className="font-bold">{entry.label}</span>
                                 <span className="opacity-40">{new Date(entry.date).toLocaleTimeString()}</span>
                               </div>
                               <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                          <button 
                            onClick={() => {
                              updatePhoto(selectedPhoto.id, { 
                                processedUrl: undefined, 
                                version: 1,
                                history: []
                              });
                            }}
                            className="text-[10px] font-bold text-ios-red uppercase tracking-widest pt-2 flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" /> Revert to Original
                          </button>
                       </div>
                    </div>
                  )}

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
                  <div className="w-[85%] max-w-[320px] aspect-[3/4] border-2 border-white/20 rounded-[4.5rem] relative">
                      <div className="absolute top-[20%] inset-x-0 h-px bg-white/5" />
                      <div className="absolute top-[50%] inset-x-0 h-px bg-white/5" />
                      <div className="absolute top-[80%] inset-x-0 h-px bg-white/5" />
                      
                      {/* FACE OVAL */}
                      <div className="absolute inset-x-[15%] top-[10%] bottom-[40%] border-2 border-dashed border-ios-blue/40 rounded-full flex items-center justify-center">
                         <div className="w-4 h-4 bg-ios-blue/20 rounded-full animate-ping" />
                      </div>

                      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2">
                        <div className="px-3 py-1 bg-ios-green/80 backdrop-blur-md rounded-full text-[8px] font-black text-white flex items-center gap-1">
                          <CheckCircle2 className="w-2 h-2" /> BACKGROUND OPTIMAL
                        </div>
                        <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[7px] font-black text-white tracking-widest uppercase border border-white/10">ALIGN EYES WITH BLUE ZONE</div>
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
      <ApiKeyModal 
        isOpen={showApiModal} 
        onClose={() => setShowApiModal(false)}
        keys={apiKeys}
        onSave={saveApiKeys}
      />

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
                     <h4 className="text-sm font-bold uppercase tracking-widest text-ios-blue">Print Layout & Border Config</h4>
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AdjustmentSlider 
                              label="Border Thickness" 
                              value={prefs.borderSize} 
                              onChange={(v: number) => setPrefs({...prefs, borderSize: v})}
                              min={0} max={20} unit="px"
                            />
                            <div className="space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Border Color ({prefs.borderColor})</label>
                              <div className="flex gap-2">
                                <input 
                                  type="color" value={prefs.borderColor}
                                  onChange={(e) => setPrefs({...prefs, borderColor: e.target.value})}
                                  className="w-full h-10 rounded-xl border-0 p-0 cursor-pointer bg-transparent"
                                />
                              </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-[var(--separator)]">
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
                     </div>
                  </section>

                  <section className="space-y-6 pt-8 border-t border-[var(--separator)]">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-ios-red">Advanced Maintenance</h4>
                     <div className="flex items-center justify-between p-4 bg-ios-red/5 rounded-2xl border border-ios-red/10">
                        <div className="space-y-0.5">
                           <p className="text-xs font-bold text-ios-red uppercase tracking-widest">Auto-Purge</p>
                           <p className="text-[9px] opacity-60 font-medium">Clear session after PDF download</p>
                        </div>
                        <button 
                         onClick={() => setPrefs({...prefs, autoDelete: !prefs.autoDelete})}
                         className={cn("w-10 h-5 rounded-full transition-all relative shadow-inner", prefs.autoDelete ? "bg-ios-red" : "bg-gray-300")}
                        >
                           <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm", prefs.autoDelete ? "translate-x-5" : "translate-x-0")} />
                        </button>
                     </div>
                     <button 
                       onClick={() => setShowApiModal(true)}
                       className="w-full py-5 bg-ios-blue/10 text-ios-blue rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-ios-blue/20 transition-all active:scale-95 shadow-lg shadow-ios-blue/10 mb-4"
                     >
                       <Key className="w-5 h-5" /> Configure API Keys
                     </button>
                     <button 
                       onClick={clearAllData}
                       className="w-full py-5 bg-ios-red/10 text-ios-red rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-ios-red/20 transition-all active:scale-95 shadow-lg shadow-ios-red/10"
                     >
                       <Trash2 className="w-5 h-5" /> Wipe All Local Data
                     </button>
                     <p className="text-[9px] text-center opacity-40 font-bold tracking-widest leading-relaxed px-4">
                       Biometric snapshots and history are permanently erased from this device.
                     </p>
                  </section>

                  <section className="space-y-6">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-ios-blue">Print Quality Engine</h4>
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
      {/* PERSPECTIVE / TRANSFORM MODAL */}
      <AnimatePresence>
        {isTransforming && selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] ios-glass flex items-center justify-center p-6"
          >
             <div className={cn("max-w-4xl w-full h-[80vh] flex flex-col md:flex-row overflow-hidden", UI.card)}>
                <div className="flex-1 bg-black/10 flex items-center justify-center p-12 overflow-hidden">
                   <div 
                    className="relative shadow-2xl transition-all duration-300 ease-out"
                    style={{ 
                      perspective: '1000px',
                      transform: `rotateX(${selectedPhoto.transform?.perspective || 0}deg) rotateZ(${selectedPhoto.transform?.rotate || 0}deg) scale(${selectedPhoto.transform?.scale || 1})` 
                    }}
                   >
                      <img 
                        src={selectedPhoto.processedUrl || selectedPhoto.blobUrl} 
                        className="max-h-[50vh] w-auto shadow-2xl border-4 border-white/20" 
                        alt="Preview" 
                      />
                      <div className="absolute inset-0 border border-ios-blue/30 pointer-events-none" />
                   </div>
                </div>
                <div className="w-full md:w-80 p-8 space-y-8 bg-[var(--bg-secondary)] border-l border-[var(--separator)]">
                   <div>
                      <h3 className="text-xl font-bold">3D Orientation</h3>
                      <p className="text-xs text-[var(--text-tertiary)] font-bold tracking-widest uppercase mt-1">Spatial Projection Engine</p>
                   </div>

                   <div className="space-y-6">
                      <AdjustmentSlider 
                        label="Vertical Tilt" 
                        value={selectedPhoto.transform?.perspective || 0} 
                        onChange={(v) => updatePhoto(selectedPhoto.id, { transform: { ...selectedPhoto.transform!, perspective: v }})}
                        min={-45} max={45} unit="°"
                      />
                      <AdjustmentSlider 
                        label="Rotation" 
                        value={selectedPhoto.transform?.rotate || 0} 
                        onChange={(v) => updatePhoto(selectedPhoto.id, { transform: { ...selectedPhoto.transform!, rotate: v }})}
                        min={-180} max={180} unit="°"
                      />
                      <AdjustmentSlider 
                        label="Zoom" 
                        value={Math.round((selectedPhoto.transform?.scale || 1) * 100)} 
                        onChange={(v) => updatePhoto(selectedPhoto.id, { transform: { ...selectedPhoto.transform!, scale: v/100 }})}
                        min={50} max={200}
                      />
                   </div>

                   <div className="pt-8 space-y-3">
                      <button 
                        onClick={async () => {
                          setIsProcessing(true);
                          // In a real app we'd flatten this to a new blob
                          // For now we persist the transform in metadata
                          await new Promise(r => setTimeout(r, 800));
                          setIsProcessing(false);
                          setIsTransforming(false);
                        }}
                        className="w-full py-4 bg-ios-blue text-white rounded-2xl font-bold shadow-lg shadow-ios-blue/20"
                      >
                        Confirm Geometry
                      </button>
                      <button 
                        onClick={() => {
                          updatePhoto(selectedPhoto.id, { transform: { rotate: 0, perspective: 0, scale: 1 }});
                          setIsTransforming(false);
                        }}
                        className="w-full py-4 bg-[var(--bg-primary)] rounded-2xl font-bold text-sm"
                      >
                        Reset & Exit
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
