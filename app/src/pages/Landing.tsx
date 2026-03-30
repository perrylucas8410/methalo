import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Lock, 
  Play,
  Settings,
  LogOut,
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

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser, userData, logout } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[Landing] Logout failed:', err.message);
    }
  };

  // Animated background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.fill();

        // Connect nearby particles
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Methalo</span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-white leading-none">
                    {userData?.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-white/5 outline-none">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage src={userData?.photoURL || currentUser?.photoURL || undefined} alt={userData?.displayName || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#0099cc] text-white">
                          {(userData?.displayName?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-[#141414] border-white/10 text-white" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userData?.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-gray-400">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => navigate('/dashboard')}
                      className="hover:bg-white/5 cursor-pointer focus:bg-white/5"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    {userData?.isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => navigate('/admin')}
                        className="hover:bg-white/5 cursor-pointer focus:bg-white/5 text-[#00d4ff]"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => navigate('/settings')}
                      className="hover:bg-white/5 cursor-pointer focus:bg-white/5"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/contact')}
                      className="hover:bg-white/5 cursor-pointer focus:bg-white/5"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Contact</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-400 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-[#00d4ff] hover:bg-[#0099cc] text-black font-semibold"
                  onClick={() => navigate('/signup')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Methalo{' '}
                <span className="bg-gradient-to-r from-[#00d4ff] to-[#0099cc] bg-clip-text text-transparent">
                  Browser
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 max-w-lg">
                A private browser thing, built by Methalo.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-[#00d4ff] hover:bg-[#0099cc] text-black font-semibold px-8"
                  onClick={() => navigate('/signup')}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Launch Secure Browser
                </Button>
              </div>
            </div>

            {/* Browser Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/20 to-[#0099cc]/20 rounded-2xl blur-3xl" />
              <div className="relative bg-[#141414] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Browser Chrome */}
                <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 bg-[#0a0a0a] rounded-md px-3 py-1.5 text-sm text-gray-500 flex items-center gap-2">
                    <Lock className="h-3 w-3 text-green-500" />
                    https://methalo.online
                  </div>
                </div>
                {/* Browser Content */}
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                  <div className="h-32 bg-gradient-to-br from-[#00d4ff]/20 to-[#0099cc]/20 rounded-lg flex items-center justify-center">
                    <Shield className="h-16 w-16 text-[#00d4ff]/50" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 bg-white/5 rounded" />
                    <div className="h-20 bg-white/5 rounded" />
                    <div className="h-20 bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-16 px-6 border-t border-white/10 bg-[#0a0a0a] relative z-10 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Methalo</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button onClick={() => navigate('/policy')} className="hover:text-white transition-colors text-xs uppercase tracking-wider font-medium">Privacy Policy</button>
              <button onClick={() => navigate('/tos')} className="hover:text-white transition-colors text-xs uppercase tracking-wider font-medium">Terms of Service</button>
              <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors text-xs uppercase tracking-wider font-medium">Contact</button>
            </div>
            
            <p className="text-xs text-gray-500 font-medium">
              © 2026 Methalo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
