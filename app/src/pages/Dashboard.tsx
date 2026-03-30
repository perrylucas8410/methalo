import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  X, 
  Globe, 
  Shield, 
  LogOut, 
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  Home,
  Settings,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
}

export default function Dashboard() {
  const { currentUser, userData, logout } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('sessionId'));
  const [isLaunching, setIsForgotLoading] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'default', title: 'New Tab', url: '', isActive: true }]);
  const [activeTabId, setActiveTabId] = useState<string>('default');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shuffleDict, setShuffleDict] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const navigate = useNavigate();

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Rammerhead Shuffler Logic
  const baseDictionary = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~-';
  const shuffledIndicator = '_rhs';
  const mod = (n: number, m: number) => ((n % m) + m) % m;

  const shuffleUrl = (url: string) => {
    if (!url || !shuffleDict) return url;
    if (url.startsWith(shuffledIndicator)) return url;
    let out = '';
    for (let i = 0; i < url.length; i++) {
      const char = url.charAt(i);
      const idx = baseDictionary.indexOf(char);
      if (char === '%' && url.length - i >= 3) {
        out += char + url.charAt(++i) + url.charAt(++i);
      } else if (idx === -1) {
        out += char;
      } else {
        out += shuffleDict.charAt(mod(idx + i, baseDictionary.length));
      }
    }
    return shuffledIndicator + out;
  };

  useEffect(() => {
    const init = async () => {
      if (sessionId) {
        try {
          const dictRes = await fetch(`/api/shuffleDict?id=${encodeURIComponent(sessionId)}`);
          if (dictRes.ok) {
            const dict = await dictRes.json();
            if (dict) setShuffleDict(dict);
          }
        } catch {
          console.warn('[Dashboard] Failed to load shuffleDict, falling back to plain URLs');
        }
      }
    };
    init();
  }, [sessionId]);

  const buildRammerheadUrl = (url: string) => {
    if (!url || !sessionId) return '';
    const finalUrl = shuffleDict ? shuffleUrl(url) : url;
    return `/${sessionId}/${finalUrl}`;
  };

  const handleLaunch = async () => {
    setIsForgotLoading(true);
    setError(null);
    try {
      const res = await fetch('/newsession');
      const id = (await res.text()).trim();
      localStorage.setItem('sessionId', id);
      setSessionId(id);
      
      const dictRes = await fetch(`/api/shuffleDict?id=${encodeURIComponent(id)}`);
      const dict = await dictRes.json();
      if (dict) setShuffleDict(dict);
      
    } catch {
      setError('Failed to initialize session');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http')) {
      if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
      else url = `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
    }
    
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url, title: 'Loading...' } : t));
    setUrlInput('');
  };

  const addTab = () => {
    const newId = crypto.randomUUID();
    setTabs(prev => [...prev, { id: newId, title: 'New Tab', url: '', isActive: true }]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([{ id: 'default', title: 'New Tab', url: '', isActive: true }]);
      setActiveTabId('default');
      return;
    }
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const handleBack = () => {
    const iframe = iframeRefs.current[activeTabId];
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.history.back();
      } catch (e) {
        console.error('Failed to navigate back:', e);
      }
    }
  };

  const handleForward = () => {
    const iframe = iframeRefs.current[activeTabId];
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.history.forward();
      } catch (e) {
        console.error('Failed to navigate forward:', e);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!currentUser) return null;

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Integrated Header - Browser Style */}
      <header className="flex-none border-b border-white/10 bg-[#141414] z-50">
        {/* Main Tool Bar */}
        <div className="h-14 flex items-center gap-4 px-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer group flex-none" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,212,255,0.5)] transition-all">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter text-white hidden md:block">Methalo</span>
          </div>

          {/* Navigation Controls + Fullscreen */}
          <div className="flex items-center gap-0.5 flex-none">
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-gray-500 h-8 w-8 hover:text-white transition-colors"><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleForward} className="text-gray-500 h-8 w-8 hover:text-white transition-colors"><ArrowRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setTabs(tabs.map(t => t.id === activeTabId ? {...t, url: ''} : t))} className="text-gray-500 h-8 w-8 hover:text-white transition-colors"><Home className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-gray-500 h-8 w-8 hover:text-white transition-colors">
              {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>

          {/* URL / Search Bar Row */}
          <div className="flex-1 flex items-center gap-2 max-w-3xl">
            <form onSubmit={handleNavigate} className="flex-1">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#00d4ff] transition-colors"><Globe className="h-3.5 w-3.5" /></div>
                <input 
                  type="text" 
                  value={urlInput} 
                  onChange={(e) => setUrlInput(e.target.value)} 
                  placeholder="Search or enter URL..." 
                  className="w-full h-9 pl-10 pr-4 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#00d4ff]/50 focus:bg-black/60 transition-all font-medium" 
                />
              </div>
            </form>
            <Button 
              variant="ghost" 
              onClick={() => setSessionId(null)} 
              className="text-red-400 hover:bg-red-500/10 font-bold h-9 px-4 rounded-xl transition-all"
            >
              Stop
            </Button>
          </div>

          {/* Right Profile & Badge */}
          <div className="flex items-center gap-3 flex-none ml-auto">
            <div className="hidden sm:flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Secure
            </div>
            
            <Separator orientation="vertical" className="h-6 bg-white/5" />

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 hidden sm:block uppercase tracking-wider">
                {userData?.displayName || currentUser.email?.split('@')[0]}
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 outline-none hover:shadow-[0_0_10px_rgba(0,212,255,0.3)] transition-all">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={userData?.photoURL || currentUser?.photoURL || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#0099cc] text-white">{(userData?.displayName?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#141414] border-white/10 text-white" align="end">
                  <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{userData?.displayName}</p><p className="text-xs leading-none text-gray-400">{currentUser.email}</p></div></DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {userData?.isAdmin && <DropdownMenuItem onClick={() => navigate('/admin')} className="text-[#00d4ff] cursor-pointer"><Shield className="mr-2 h-4 w-4" /><span>Admin Panel</span></DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/contact')} className="cursor-pointer"><Mail className="mr-2 h-4 w-4" /><span>Contact</span></DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" /><DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Sign Out</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tab Strip - BLUE PILL STYLE */}
        <div className="h-12 flex items-center px-2 gap-1 bg-[#0f0f0f] border-t border-white/5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 p-1">
            {tabs.map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTabId(tab.id)} 
                className={`group flex items-center gap-2 px-3 h-8 rounded-md text-sm font-bold transition-all whitespace-nowrap border ${tab.id === activeTabId ? 'bg-[#00d4ff]/20 text-white border-[#00d4ff]/30' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-gray-300'}`}
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                <span className="max-w-[140px] truncate text-xs">{tab.title || 'New Tab'}</span>
                <X className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" onClick={(e) => closeTab(tab.id, e)} />
              </button>
            ))}
            <Button variant="ghost" size="icon" onClick={addTab} className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative bg-black">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-500 text-white px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-2 text-xs font-bold">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-3 w-3 ml-2" /></button>
          </div>
        )}

        {!sessionId ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#0a0a0a]">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center mx-auto shadow-2xl shadow-[#00d4ff]/20">
                {isLaunching ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Shield className="w-10 h-10 text-white" />}
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-white uppercase">{isLaunching ? 'Syncing...' : 'Secure Gateway'}</h2>
                <p className="text-gray-500 font-medium text-sm">Initialize your isolated browser session.</p>
              </div>
              <Button onClick={handleLaunch} disabled={isLaunching} className="w-full bg-[#00d4ff] hover:bg-[#0099cc] text-black font-[900] uppercase tracking-widest h-14 rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#00d4ff]/10">
                {isLaunching ? 'Initializing...' : 'Launch Browser'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {tabs.map((tab) => (
              <div key={tab.id} className="absolute inset-0" style={{ display: tab.id === activeTabId ? 'block' : 'none' }}>
                {tab.url ? (
                  <iframe 
                    ref={el => { iframeRefs.current[tab.id] = el; }}
                    src={buildRammerheadUrl(tab.url)} 
                    className="w-full h-full border-none bg-white"
                    title={tab.title}
                  />
                ) : (
                  <div className="w-full h-full bg-black flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-6 mb-10 text-6xl font-black text-white group cursor-default">
                        <Shield className="w-20 h-20 text-[#00d4ff] drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]" />
                        Methalo
                      </div>
                      <div className="max-w-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-12 rounded-[48px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
                        <h2 className="text-2xl font-black mb-6 tracking-tight uppercase text-[#00d4ff]">Secure Link Active</h2>
                        <p className="text-gray-400 leading-relaxed italic font-medium text-base">
                          "This browser is currently in development, and some things won't work, such as YouTube with a normal personal account; however, some school or organization accounts will work for it. Also, some websites are strict and have more security, so they block proxies. Also, when searching, if you don't put the entire URL into the search bar, it will open it in a pop-up instead of the browser, which can cause problems for websites. Also, I'll be making some better versions that use more resources, so I can't make infinite, but message me, and I'll give you the passcode for them, and you log in at premium.methalo.online."
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
