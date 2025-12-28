
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from './services/geminiService';
import { 
  GenerationState, 
  GeneratedResult, 
  QualityLevel, 
  SenseiMessage, 
  CharacterDesign, 
  User, 
  AppSettings, 
  ArtStyle, 
  LightingStyle, 
  CompositionStyle 
} from './types';
import CharacterSheet from './components/CharacterSheet';

const ADMIN_EMAIL = "abhi.solanki142011@gmail.com";
const ADMIN_PASS = "aaruto100108112";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<QualityLevel>('GENIN');
  const [state, setState] = useState<GenerationState>(GenerationState.IDLE);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [historyViewMode, setHistoryViewMode] = useState<'grid' | 'list'>('grid');
  const [savedScrolls, setSavedScrolls] = useState<GeneratedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImmersiveImage, setShowImmersiveImage] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    autoSave: true,
    resolution: '1024',
    artStyle: 'Classic Anime',
    lighting: 'Cinematic',
    composition: 'Dynamic Pose'
  });
  
  const [showSensei, setShowSensei] = useState(false);
  const [messages, setMessages] = useState<SenseiMessage[]>([
    { role: 'sensei', text: "Welcome to AARUTO_ANIME.AI. Manifest your vision with god-tier precision." }
  ]);
  const [senseiInput, setSenseiInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const gemini = useRef(new GeminiService());

  useEffect(() => {
    const savedUser = localStorage.getItem('aaruto_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('aaruto_user');
      }
    }
    
    const savedHistoryLocal = localStorage.getItem('aaruto_history');
    if (savedHistoryLocal) { try { setHistory(JSON.parse(savedHistoryLocal)); } catch (e) {} }

    const savedScrollsLocal = localStorage.getItem('aaruto_saved_scrolls');
    if (savedScrollsLocal) { try { setSavedScrolls(JSON.parse(savedScrollsLocal)); } catch (e) {} }
    
    const savedSettingsLocal = localStorage.getItem('aaruto_settings');
    if (savedSettingsLocal) { try { setSettings(JSON.parse(savedSettingsLocal)); } catch (e) {} }
    
    const savedDraft = localStorage.getItem('aaruto_current_draft');
    if (savedDraft) { try { setResult(JSON.parse(savedDraft)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (!settings.autoSave || !result) return;
    const interval = setInterval(() => {
      localStorage.setItem('aaruto_current_draft', JSON.stringify(result));
    }, 60000);
    return () => clearInterval(interval);
  }, [result, settings.autoSave]);

  useEffect(() => {
    localStorage.setItem('aaruto_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('aaruto_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    if (authMode === 'LOGIN') {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        const u = { email, isAdmin: true };
        setUser(u);
        localStorage.setItem('aaruto_user', JSON.stringify(u));
        return;
      }
      const users = JSON.parse(localStorage.getItem('aaruto_all_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (found) {
        const u = { email: found.email, isAdmin: false };
        setUser(u);
        localStorage.setItem('aaruto_user', JSON.stringify(u));
      } else setError("Mismatch. Access denied.");
    } else {
      const users = JSON.parse(localStorage.getItem('aaruto_all_users') || '[]');
      if (users.find((u: any) => u.email === email)) { setError("Identity already bound."); return; }
      users.push({ email, password });
      localStorage.setItem('aaruto_all_users', JSON.stringify(users));
      const u = { email: email, isAdmin: false };
      setUser(u);
      localStorage.setItem('aaruto_user', JSON.stringify(u));
    }
  };

  const handleSummon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || state !== GenerationState.IDLE) return;
    setError(null);
    try {
      setState(GenerationState.GENERATING_DESIGN);
      const design = await gemini.current.generateDesign(prompt);
      setState(GenerationState.GENERATING_IMAGE);
      const imageUrl = await gemini.current.generateImage(design, quality, settings);
      const newResult: GeneratedResult = { 
        imageUrl, 
        design, 
        timestamp: Date.now(), 
        quality,
        artStyle: settings.artStyle,
        lighting: settings.lighting,
        composition: settings.composition,
        resolution: settings.resolution
      };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 30));
      setState(GenerationState.IDLE);
      if (window.innerWidth < 768) setShowImmersiveImage(true);
      showNotify("Manifestation successful.");
    } catch (err: any) {
      showNotify("Manifestation failed.");
      setState(GenerationState.IDLE);
    }
  };

  const handleEvolve = async () => {
    if (!result || state !== GenerationState.IDLE) return;
    setState(GenerationState.EVOLVING);
    try {
      const evolved = await gemini.current.evolveDesign(result.design);
      setState(GenerationState.GENERATING_IMAGE);
      const imageUrl = await gemini.current.generateImage(evolved, quality, settings);
      const newResult = { ...result, design: evolved, imageUrl, timestamp: Date.now() };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 30));
      if (window.innerWidth < 768) setShowImmersiveImage(true);
      showNotify("Ascension complete.");
    } catch (err) { showNotify("Evolution failed."); }
    finally { setState(GenerationState.IDLE); }
  };

  const handleGenEnv = async () => {
    if (!result || state !== GenerationState.IDLE) return;
    setState(GenerationState.GENERATING_ENV);
    try {
      const envImageUrl = await gemini.current.generateImage(result.design, quality, settings, 'environment');
      const newResult = { ...result, envImageUrl };
      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 30));
      if (window.innerWidth < 768) setShowImmersiveImage(true);
      showNotify("World manifested.");
    } catch (err) { showNotify("World manifestation failed."); }
    finally { setState(GenerationState.IDLE); }
  };

  const handlePlayTheme = async () => {
    if (!result || state !== GenerationState.IDLE) return;
    setState(GenerationState.GENERATING_AUDIO);
    try {
      const b64 = await gemini.current.generateThemeAudio(result.design);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const i16 = new Int16Array(bytes.buffer);
      const buf = ctx.createBuffer(1, i16.length, 24000);
      const data = buf.getChannelData(0);
      for (let i = 0; i < i16.length; i++) data[i] = i16[i] / 32768.0;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
      showNotify("Theme resonating.");
    } catch (e) { showNotify("Audio resonance failed."); }
    finally { setState(GenerationState.IDLE); }
  };

  const saveToScrolls = () => {
    if (!result) return;
    const updated = [result, ...savedScrolls].slice(0, 50);
    setSavedScrolls(updated);
    localStorage.setItem('aaruto_saved_scrolls', JSON.stringify(updated));
    showNotify("Archived.");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aaruto_history');
    showNotify("History purged.");
  };

  const artStyles: ArtStyle[] = [
    'Classic Anime', 'Ufotable Style', 'Studio Ghibli', 
    'Cyberpunk Edge', 'Retro 90s', 'Ink Wash', 
    'Realistic', 'Digital Concept', 'Fantasy Oil', 
    'High-Impact Shonen', 'Vintage Manga'
  ];

  const lightingStyles: LightingStyle[] = [
    'Cinematic', 'Ethereal', 'Dramatic', 'Neon', 'Golden Hour', 'Cyber-Noir'
  ];

  // Fix: Proper early return for login screen to avoid null access on 'user' object properties
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6 bg-black relative">
        <div className="absolute inset-0 chakra-gradient opacity-10 blur-[120px]" />
        <div className="w-full max-w-sm glass p-10 rounded-[2.5rem] border-orange-500/20 text-center relative z-10 animate-in fade-in duration-700">
          <div className="w-20 h-20 chakra-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-45 shadow-[0_0_50px_rgba(255,107,0,0.3)]">
            <i className="fa-solid fa-atom text-white text-4xl -rotate-45"></i>
          </div>
          <h1 className="text-3xl font-bungee mb-10 tracking-tighter uppercase">AARUTO_<span className="chakra-text">ANIME.AI</span></h1>
          
          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)} 
              placeholder="Access Email" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-all text-sm" 
            />
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)} 
              placeholder="Soul Passkey" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-all text-sm" 
            />
            <button className="w-full py-5 chakra-gradient rounded-2xl font-bungee text-white tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-500/20 text-xs">
              {authMode === 'LOGIN' ? 'UNSEAL ENTRY' : 'MANIFEST IDENTITY'}
            </button>
          </form>
          
          <button 
            onClick={() => { setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setError(null); }} 
            className="mt-8 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] hover:text-orange-500 transition-colors"
          >
            {authMode === 'LOGIN' ? 'Register new essence?' : 'Return to existing record?'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col font-space bg-black text-white relative overflow-hidden">
      <header className="flex-shrink-0 px-8 py-5 border-b border-white/5 glass flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 chakra-gradient rounded-xl flex items-center justify-center rotate-45 shadow-lg"><i className="fa-solid fa-bolt text-white text-lg -rotate-45"></i></div>
          <h1 className="text-xl font-bungee hidden md:block">AARUTO_<span className="chakra-text">ANIME.AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
             <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{user.isAdmin ? 'MASTER ARCHITECT' : 'SUMMONER'}</span>
             <span className="text-[9px] text-gray-500 truncate max-w-[150px]">{user.email}</span>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10"><i className="fa-solid fa-gear"></i></button>
          <button onClick={() => setShowSensei(!showSensei)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${showSensei ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}><i className="fa-solid fa-comments"></i></button>
          <button onClick={() => { localStorage.removeItem('aaruto_user'); setUser(null); }} className="text-[11px] text-red-500 font-black uppercase tracking-widest px-4 py-2 hover:bg-red-500/10 rounded-xl transition-all">OUT</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
        
        {/* Sidebar History */}
        <aside className="hidden lg:flex flex-col gap-8 w-80 h-full overflow-y-auto custom-scrollbar pr-3">
          <section>
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em]">Temporal History</h4>
                <div className="flex items-center gap-3">
                  <button onClick={() => setHistoryViewMode('grid')} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${historyViewMode === 'grid' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-white'}`}><i className="fa-solid fa-table-cells-large"></i></button>
                  <button onClick={() => setHistoryViewMode('list')} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${historyViewMode === 'list' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-white'}`}><i className="fa-solid fa-list-ul"></i></button>
                  <button onClick={clearHistory} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors" title="Purge Records"><i className="fa-solid fa-trash-can"></i></button>
                </div>
             </div>
             
             {history.length === 0 ? (
               <div className="text-center py-16 opacity-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                 <i className="fa-solid fa-hourglass-start text-3xl mb-4"></i>
                 <p className="text-[11px] font-black uppercase tracking-[0.3em]">History Empty</p>
               </div>
             ) : (
               <div className={historyViewMode === 'grid' ? "grid grid-cols-3 gap-3" : "flex flex-col gap-3"}>
                  {history.map((item) => (
                    <button 
                      key={item.timestamp} 
                      onClick={() => {
                        setResult(item);
                        if (window.innerWidth < 768) setShowImmersiveImage(true);
                      }} 
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${result?.timestamp === item.timestamp ? 'border-orange-500 scale-105 shadow-[0_0_20px_rgba(255,107,0,0.3)] z-10' : 'border-white/5 opacity-50 hover:opacity-100'} ${historyViewMode === 'list' ? 'flex items-center gap-4 p-3 bg-white/5' : 'aspect-square'}`}
                    >
                      <img src={item.imageUrl} className={historyViewMode === 'list' ? "w-14 h-14 rounded-xl object-cover flex-shrink-0" : "w-full h-full object-cover"} />
                      {historyViewMode === 'list' && (
                        <div className="text-left min-w-0">
                          <p className="text-[11px] font-black uppercase truncate text-white">{item.design.name}</p>
                          <p className="text-[9px] font-bold text-gray-500 truncate tracking-widest">{item.design.title}</p>
                        </div>
                      )}
                    </button>
                  ))}
               </div>
             )}
          </section>

          <section>
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em]">Eternal Archive</h4>
                <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded-full text-gray-400">{savedScrolls.length}</span>
             </div>
             <div className="space-y-3">
                {savedScrolls.map((item) => (
                  <button 
                    key={item.timestamp} 
                    onClick={() => {
                      setResult(item);
                      if (window.innerWidth < 768) setShowImmersiveImage(true);
                    }}
                    className="group w-full flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-white truncate uppercase tracking-tight">{item.design.name}</p>
                      <span className={`text-[9px] font-bold text-gray-500 uppercase tracking-widest`}>{item.quality} Manifest</span>
                    </div>
                  </button>
                ))}
             </div>
          </section>
        </aside>

        <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full h-full">
          <div className="flex-shrink-0 flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
            {(['GENIN', 'CHUNIN', 'JONIN'] as QualityLevel[]).map(q => (
              <button key={q} onClick={() => setQuality(q)} className={`px-8 py-3 rounded-2xl text-[11px] font-black tracking-[0.2em] whitespace-nowrap transition-all ${quality === q ? 'chakra-gradient text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{q}</button>
            ))}
          </div>

          <div className="flex-1 min-h-0 relative glass rounded-[3rem] overflow-hidden border-white/5 group shadow-2xl">
            {result ? (
              <div className="flex flex-col md:flex-row h-full overflow-y-auto custom-scrollbar">
                <div className="w-full md:w-5/12 h-96 md:h-full relative overflow-hidden flex-shrink-0">
                  <img 
                    src={result.imageUrl} 
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-[5s]" 
                    onClick={() => setShowImmersiveImage(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <h2 className="text-2xl md:text-3xl font-bungee text-white drop-shadow-2xl truncate leading-none mb-1">{result.design.name}</h2>
                    <p className="text-[11px] text-orange-500 font-black uppercase tracking-[0.3em]">{result.design.title} | Stage {result.design.evolutionStage}</p>
                  </div>
                  <button onClick={() => setShowImmersiveImage(true)} className="absolute top-6 right-6 bg-black/50 p-4 rounded-full text-white backdrop-blur md:hidden shadow-xl"><i className="fa-solid fa-expand"></i></button>
                </div>
                <div className="flex-1 p-8 md:p-12">
                  <CharacterSheet 
                    design={result.design} 
                    onUpdate={(f, v) => setResult({ ...result, design: { ...result.design, [f]: v } })} 
                    gemini={gemini.current}
                    onEvolve={handleEvolve}
                    onGenEnv={handleGenEnv}
                    onPlayTheme={handlePlayTheme}
                    onNotify={showNotify}
                    isProcessing={state !== GenerationState.IDLE}
                  />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-32 h-32 md:w-48 md:h-48 relative mb-12">
                   <div className="absolute inset-0 chakra-gradient rounded-full opacity-20 blur-3xl animate-pulse" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-dna text-6xl md:text-8xl text-orange-500/20"></i>
                   </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bungee mb-6 tracking-tight">Akashic Terminal Ready</h3>
                <p className="text-gray-500 text-sm max-w-sm font-bold uppercase tracking-[0.3em] leading-relaxed">Enter your visualization below to pull existence from the Multiverse.</p>
              </div>
            )}

            {state !== GenerationState.IDLE && (
              <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500 backdrop-blur-3xl">
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-10">
                   <div className="absolute inset-0 border-t-4 border-orange-500 rounded-full animate-spin" />
                   <div className="absolute inset-0 border-r-4 border-cyan-500 rounded-full animate-spin duration-1000" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-atom text-4xl text-white animate-pulse"></i>
                   </div>
                </div>
                <p className="text-orange-500 font-bungee text-lg md:text-xl tracking-[0.5em] animate-pulse uppercase">
                  {state === GenerationState.GENERATING_DESIGN ? 'Reading Fate...' : 
                   state === GenerationState.EVOLVING ? 'Transmuting...' : 
                   state === GenerationState.GENERATING_IMAGE ? 'Realizing Form...' : 'Constructing World...'}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSummon} className="flex-shrink-0 flex flex-col md:flex-row gap-4 p-5 glass rounded-[2.5rem] border-white/10 mb-4 shadow-2xl">
            <input 
              type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Whisper a legend into the void..."
              className="flex-1 bg-transparent px-6 text-lg font-bold outline-none placeholder:text-gray-700" disabled={state !== GenerationState.IDLE}
            />
            <button className="h-16 px-12 chakra-gradient rounded-2xl font-bungee tracking-[0.3em] text-sm text-white disabled:opacity-50 hover:scale-[1.03] transition-all shadow-xl shadow-orange-500/10" disabled={state !== GenerationState.IDLE || !prompt.trim()}>MANIFEST</button>
          </form>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-3xl glass p-10 md:p-14 rounded-[3.5rem] border-white/10 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowSettings(false)} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
            <h2 className="text-3xl font-bungee mb-12 tracking-wider uppercase">Engine_<span className="chakra-text">Parameters</span></h2>
            
            <div className="space-y-10">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <div>
                   <h4 className="text-lg font-bold text-white mb-1">Temporal Sync</h4>
                   <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest">Auto-save current manifestation</p>
                </div>
                <button onClick={() => setSettings({...settings, autoSave: !settings.autoSave})} className={`w-14 h-7 rounded-full relative transition-all ${settings.autoSave ? 'bg-orange-600' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${settings.autoSave ? 'right-1' : 'left-1'}`} /></button>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Artistic Paradigm</h4>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {artStyles.map(s => (
                      <button key={s} onClick={() => setSettings({...settings, artStyle: s})} className={`py-4 px-3 rounded-2xl text-[10px] font-black uppercase transition-all ${settings.artStyle === s ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}>{s}</button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Spectral Resolution</h4>
                  <div className="flex gap-3">
                    {['512', '1024', '2048'].map(r => (
                      <button key={r} onClick={() => setSettings({...settings, resolution: r as any})} className={`flex-1 py-4 rounded-2xl text-[11px] font-black transition-all ${settings.resolution === r ? 'bg-cyan-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{r}px</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Lighting Frequency</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {lightingStyles.map(l => (
                      <button key={l} onClick={() => setSettings({...settings, lighting: l})} className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase transition-all ${settings.lighting === l ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Lens Composition</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                   {['Dynamic Pose', 'Portrait', 'Wide Shot', 'Epic Low Angle', 'Close-up Detail'].map(c => (
                     <button key={c} onClick={() => setSettings({...settings, composition: c as CompositionStyle})} className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase transition-all ${settings.composition === c ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{c}</button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sensei Sidebar */}
      <div className={`fixed top-0 right-0 w-full md:w-[450px] h-full z-[120] bg-[#080808] border-l border-white/5 shadow-2xl transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${showSensei ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/5">
                <i className="fa-solid fa-brain text-cyan-500 text-xl"></i>
             </div>
             <div>
                <h4 className="font-bungee text-sm tracking-widest text-white">Omni-Sensei</h4>
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">AI Intelligence</span>
             </div>
          </div>
          <button onClick={() => setShowSensei(false)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] px-6 py-5 rounded-[2rem] text-[14px] leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-white/5 text-gray-400 rounded-tl-none border border-white/10'}`}>{m.text}</div>
            </div>
          ))}
          {state === GenerationState.SENSEI_THINKING && (
             <div className="flex items-center gap-4 text-cyan-500/50 animate-pulse px-4">
                <i className="fa-solid fa-circle-nodes fa-spin text-sm"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Consulting the Archive...</span>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={async e => {
          e.preventDefault(); if (!senseiInput.trim()) return;
          const msg = senseiInput; setSenseiInput(''); setMessages(prev => [...prev, {role:'user', text: msg}]);
          setState(GenerationState.SENSEI_THINKING);
          try {
            const reply = await gemini.current.senseiAdvice(messages.concat([{role:'user', text:msg}]).map(x=>({role: x.role==='sensei'?'model':'user', parts:[{text:x.text}] })));
            setMessages(prev => [...prev, {role:'sensei', text: reply}]);
          } catch(e) { setMessages(prev => [...prev, {role:'sensei', text:'Spirit signal destabilized. Try again.'}]); }
          finally { setState(GenerationState.IDLE); }
        }} className="p-8 border-t border-white/5 bg-black/60">
          <div className="relative">
            <input value={senseiInput} onChange={e=>setSenseiInput(e.target.value)} placeholder="Seek wisdom from the Guide..." className="w-full bg-black border border-white/10 rounded-[2rem] px-8 py-5 text-sm focus:border-cyan-500 outline-none transition-all pr-16 font-medium shadow-inner" />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-400 p-2 transition-all"><i className="fa-solid fa-paper-plane text-xl"></i></button>
          </div>
        </form>
      </div>

      {/* Immersive View */}
      {showImmersiveImage && result && (
        <div className="fixed inset-0 z-[200] bg-black animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
          <button onClick={() => setShowImmersiveImage(false)} className="fixed top-10 right-10 z-[210] w-14 h-14 bg-black/60 rounded-[1.5rem] flex items-center justify-center text-white backdrop-blur shadow-2xl border border-white/10"><i className="fa-solid fa-xmark text-2xl"></i></button>
          <div className="min-h-full w-full flex flex-col items-center justify-center p-4 py-20">
            <div className="flex-1 relative w-full flex items-center justify-center">
              <img src={result.imageUrl} className="max-w-full max-h-[80vh] object-contain rounded-[2rem] shadow-[0_0_100px_rgba(255,107,0,0.2)]" />
              {result.envImageUrl && (
                <div className="absolute bottom-10 right-10 w-48 h-28 border-2 border-white/30 rounded-[1.5rem] overflow-hidden shadow-2xl group/swap">
                  <img src={result.envImageUrl} className="w-full h-full object-cover transition-transform group-hover/swap:scale-110 duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/swap:opacity-100 transition-opacity"><button onClick={() => setResult({...result, imageUrl: result.envImageUrl!, envImageUrl: result.imageUrl})} className="text-[11px] font-black uppercase text-white tracking-widest bg-orange-600 px-4 py-2 rounded-xl">SWAP VIEW</button></div>
                </div>
              )}
            </div>
            <div className="p-10 glass rounded-[3rem] border-t border-white/10 text-center w-full max-w-4xl mt-12 mx-auto">
              <h2 className="text-3xl md:text-4xl font-bungee text-white mb-2 leading-none">{result.design.name}</h2>
              <p className="text-[11px] text-orange-500 font-black uppercase tracking-[0.4em] mb-8">{result.design.title} | {result.quality} Manifest | {result.resolution}px</p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                 {result.design.powers.slice(0, 3).map((p, i) => (
                   <span key={i} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-white/5">{p}</span>
                 ))}
              </div>
              <div className="flex justify-center gap-4">
                <button onClick={saveToScrolls} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bungee text-[11px] tracking-[0.3em] text-white hover:bg-white/10 transition-all uppercase">Archive Record</button>
                <button onClick={() => setShowImmersiveImage(false)} className="px-10 py-5 bg-orange-600 rounded-2xl font-bungee text-[11px] tracking-[0.3em] text-white hover:scale-105 transition-all shadow-xl shadow-orange-500/20 uppercase">CLOSE INSPECTION</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Notification Toast - Small and non-intrusive */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] bg-orange-600/90 backdrop-blur text-white px-5 py-2 rounded-xl font-black text-[9px] tracking-widest shadow-2xl animate-in slide-in-from-top-2 duration-300 uppercase">
          {notification}
        </div>
      )}
    </div>
  );
};

export default App;
