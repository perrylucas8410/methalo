import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Camera,
  Link as LinkIcon,
  Crown,
  X,
  Smartphone,
  Trash2,
  Send,
  IdCard,
  FileText,
  ExternalLink,
  LifeBuoy,
  LogOut,
  Monitor
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Settings() {
  const auth = useAuth();
  const navigate = useNavigate();
  
  const currentUser = auth?.currentUser;
  const userData = auth?.userData;
  const updateProfileInfo = auth?.updateProfileInfo;
  const linkEmailAccount = auth?.linkEmailAccount;
  const linkGoogleAccount = auth?.linkGoogleAccount;
  const unlinkAccount = auth?.unlinkAccount;
  const sendVerification = auth?.sendVerification;
  const refreshUserData = auth?.refreshUserData;
  const changePassword = auth?.changePassword;
  const logout = auth?.logout;

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkStep, setLinkStep] = useState(1); 
  const [linkError, setLinkError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<{id: string, name: string} | null>(null);
  const [isResending, setIsResending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!displayName.trim() || !updateProfileInfo) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await updateProfileInfo({ displayName: displayName.trim() });
      setMessage({ type: 'success', text: 'Profile updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !changePassword) return;
    setIsUpdatingPassword(true);
    try {
      await changePassword(newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setIsPassDialogOpen(false);
      setNewPassword('');
    } catch (err: any) {
      if (err.message?.includes('requires-recent-login')) {
        setMessage({ 
          type: 'error', 
          text: 'For security, please sign out and sign back in before changing your password.' 
        });
      } else {
        setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
      }
      setIsPassDialogOpen(false);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updateProfileInfo) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          await updateProfileInfo({ photoURL: canvas.toDataURL('image/jpeg', 0.7) });
          setMessage({ type: 'success', text: 'Profile image updated!' });
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setMessage({ type: 'error', text: 'Upload failed.' });
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      navigate('/', { replace: true });
      if (logout) await logout();
    } catch (err: any) {
      console.error('[Settings] Logout failed:', err.message);
    }
  };

  const handleStartLinking = async () => {
    if (!linkEmail || !linkPassword || !linkEmailAccount || !sendVerification) return;
    setLinkError(null);
    setIsLinking(true);
    try {
      await linkEmailAccount(linkEmail, linkPassword);
      await sendVerification();
      setLinkStep(2);
    } catch (err: any) {
      setLinkError(err.message || 'Link failed.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!linkGoogleAccount) return;
    setIsLinking(true);
    try {
      await linkGoogleAccount();
      setMessage({ type: 'success', text: 'Google linked!' });
    } catch {
      setMessage({ type: 'error', text: 'Google link failed.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkingProvider || !unlinkAccount) return;
    setIsLinking(true);
    try {
      await unlinkAccount(unlinkingProvider.id);
      setIsUnlinkDialogOpen(false);
      setMessage({ type: 'success', text: 'Account unlinked.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Unlink failed.' });
      setIsUnlinkDialogOpen(false);
    } finally {
      setIsLinking(false);
      setTimeout(() => setUnlinkingProvider(null), 300);
    }
  };

  const checkVerificationStatus = async () => {
    if (!currentUser || !refreshUserData) return;
    setIsSaving(true);
    try {
      await currentUser.reload();
      await refreshUserData();
      setMessage(currentUser.emailVerified ? { type: 'success', text: 'Verified!' } : { type: 'error', text: 'Not yet verified.' });
    } catch {
      setMessage({ type: 'error', text: 'Refresh failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!sendVerification) return;
    setIsResending(true);
    try {
      await sendVerification();
      setMessage({ type: 'success', text: 'Verification email sent!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send email.' });
    } finally {
      setIsResending(false);
    }
  };

  const closeLinkDialog = () => {
    setIsLinkDialogOpen(false);
    setLinkStep(1);
    setLinkEmail('');
    setLinkPassword('');
  };

  const googleData = currentUser?.providerData.find(p => p.providerId === 'google.com');
  const emailData = currentUser?.providerData.find(p => p.providerId === 'password');
  const isEmailVerified = currentUser?.emailVerified;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="h-16 border-b border-white/10 bg-[#141414]/80 backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,212,255,0.5)] transition-all">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white group-hover:text-[#00d4ff] transition-colors">Methalo</span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white hidden sm:flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-white leading-none">{userData?.displayName || currentUser.email?.split('@')[0]}</span>
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
                {userData?.isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="hover:bg-white/5 cursor-pointer focus:bg-white/5 text-[#00d4ff]">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="hover:bg-white/5 cursor-pointer focus:bg-white/5">
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/contact')} className="hover:bg-white/5 cursor-pointer focus:bg-white/5">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Contact</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-8 pb-20">
        {message && (
          <div className={`p-4 rounded-lg flex items-center justify-between gap-2 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)}><X className="h-4 w-4 opacity-50 hover:opacity-100" /></button>
          </div>
        )}

        {/* Unified Profile Card */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <IdCard className="w-4 h-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider">Account Profile</h2>
          </div>
          <Card className="bg-[#141414] border-white/10 text-white shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Shield className="w-48 h-48 text-[#00d4ff]" /></div>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-12 items-center justify-center relative z-10">
                {/* Left side */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-2 border-white/10 group-hover:border-[#00d4ff] transition-all shadow-2xl">
                      <AvatarImage src={userData?.photoURL || currentUser?.photoURL || undefined} />
                      <AvatarFallback className="text-4xl bg-white/5">{displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute bottom-0 right-0 p-2.5 bg-[#00d4ff] text-black rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50">
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>
                  
                  <div className="w-full max-w-[320px] space-y-6">
                    <div className="grid gap-2">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center">Display Name</Label>
                      <div className="flex gap-2">
                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-white/5 border-white/10 focus:border-[#00d4ff] h-10 flex-1 text-white" />
                        <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black font-bold h-10 px-4">Save</Button>
                      </div>
                    </div>
                    <Separator className="bg-white/5" />
                    <div className="grid gap-2">
                      <Label className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center">Account Password</Label>
                      <div className="flex gap-2">
                        <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-white/5 border-white/10 focus:border-[#00d4ff] h-10 flex-1 text-white" />
                        <Button onClick={() => setIsPassDialogOpen(true)} disabled={!newPassword || newPassword.length < 6} variant="outline" className="border-white/10 text-white h-10 px-4 hover:bg-white/5">Update</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block w-px h-64 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                {/* Right side */}
                <div className="flex-1 flex flex-col gap-10 items-center justify-center h-full w-full">
                  <div className="space-y-8 flex flex-col items-center text-center">
                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center justify-center gap-2"><Crown className="w-3 h-3 text-amber-400" /> Account Type</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black italic text-[#00d4ff] tracking-tight">{userData?.accountType || 'Free'}</span>
                      </div>
                    </div>
                  </div>
                  <Separator className="w-1/3 bg-white/5" />
                  <div className="space-y-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center justify-center gap-2"><Shield className="w-3 h-3 text-green-500" /> Security Status</p>
                    <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                      <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Isolation</span>
                        <span className="text-green-400 font-bold uppercase text-[10px]">Active</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded border border-white/5 text-center">
                        <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Encryption</span>
                        <span className="text-green-400 font-bold uppercase text-[10px]">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left card */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-gray-400"><LinkIcon className="w-4 h-4" /><h2 className="text-sm font-medium uppercase tracking-wider">Connected Identities</h2></div>
            <Card className="bg-[#141414] border-white/10 text-white shadow-xl flex-1">
              <CardContent className="p-6 h-full flex flex-col justify-center gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 min-h-[72px]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.75c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Google</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{googleData ? googleData.email : 'Not connected'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {googleData ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 uppercase" style={{fontSize:'9px'}}>Linked</Badge>
                          <Button variant="ghost" size="sm" onClick={() => { setUnlinkingProvider({id:'google.com', name:'Google'}); setIsUnlinkDialogOpen(true); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleLinkGoogle} disabled={isLinking} className="bg-white text-black h-8 text-xs font-bold px-4 hover:bg-white/90">Link</Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 min-h-[72px]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Mail className="w-5 h-5 text-gray-400" /></div>
                      <div>
                        <p className="font-medium text-sm">Methalo</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{emailData ? emailData.email : 'Not linked'}</p>
                        {emailData && !isEmailVerified && (
                          <div className="flex items-center gap-1 mt-1 text-amber-500 font-bold uppercase text-[9px] italic">
                            Pending Link 
                            <button onClick={checkVerificationStatus} className="text-[#00d4ff] hover:underline ml-1">Refresh</button>
                            <span className="text-gray-600 mx-1">|</span>
                            <button 
                              onClick={handleResendVerification} 
                              disabled={isResending}
                              className="text-[#00d4ff] hover:underline disabled:opacity-50"
                            >
                              {isResending ? 'Sending...' : 'Resend'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {emailData ? (
                        <div className="flex items-center gap-2">
                          <Badge className={isEmailVerified ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"} style={{fontSize:'9px'}}>{isEmailVerified ? 'Verified' : 'Pending'}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => { setUnlinkingProvider({id:'password', name:'Email'}); setIsUnlinkDialogOpen(true); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => setIsLinkDialogOpen(true)} className="bg-white text-black h-8 text-xs font-bold px-4 hover:bg-white/90">Link</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right card */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-gray-400"><FileText className="w-4 h-4" /><h2 className="text-sm font-medium uppercase tracking-wider">Quick Resources</h2></div>
            <Card className="bg-[#141414] border-white/10 text-white shadow-xl overflow-hidden flex-1">
              <CardContent className="p-0 h-full flex flex-col justify-center">
                <div className="flex flex-col">
                  <button onClick={() => navigate('/contact')} className="flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 group transition-colors"><div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-500 group-hover:text-[#00d4ff]" /><span className="text-sm font-medium">Contact Information</span></div><ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" /></button>
                  <button onClick={() => navigate('/support')} className="flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 group transition-colors"><div className="flex items-center gap-3"><LifeBuoy className="w-5 h-5 text-gray-500 group-hover:text-[#00d4ff]" /><span className="text-sm font-medium">Support & Help</span></div><ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" /></button>
                  <button onClick={() => navigate('/policy')} className="flex items-center justify-between p-6 hover:bg-white/5 border-b border-white/5 group transition-colors"><div className="flex items-center gap-3"><Shield className="w-5 h-5 text-gray-500 group-hover:text-[#00d4ff]" /><span className="text-sm font-medium">Privacy Policy</span></div><ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" /></button>
                  <button onClick={() => navigate('/tos')} className="flex items-center justify-between p-6 hover:bg-white/5 group transition-colors"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-gray-500 group-hover:text-[#00d4ff]" /><span className="text-sm font-medium">Terms of Service</span></div><ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" /></button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isPassDialogOpen} onOpenChange={setIsPassDialogOpen}>
          <DialogContent className="bg-[#141414] border-white/10 text-white p-8 max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mx-auto mb-4"><Lock className="w-8 h-8" /></div>
            <DialogHeader className="mb-6"><DialogTitle className="text-xl font-bold text-white">Update Password?</DialogTitle><DialogDescription className="text-gray-400 text-sm">Change your account password? You will need the new one for future logins.</DialogDescription></DialogHeader>
            <div className="flex flex-col gap-3">
              <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword} className="bg-[#00d4ff] hover:bg-[#0099cc] text-black font-bold h-12 transition-all">{isUpdatingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Change'}</Button>
              <Button variant="ghost" onClick={() => setIsPassDialogOpen(false)} className="text-gray-400 hover:text-white">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="bg-[#141414] border-white/10 text-white p-0 overflow-hidden max-w-md shadow-2xl">
            <div className="relative">
              <button onClick={closeLinkDialog} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/10 z-50 transition-colors"><X className="h-4 w-4 text-gray-400 hover:text-white" /></button>
              <div className="p-8">
                <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white"><Smartphone className="h-6 w-6 text-[#00d4ff]" /> {linkStep === 1 ? 'Link Identity' : 'Verification Sent'}</DialogTitle></DialogHeader>
                {linkError && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2 animate-in shake duration-300"><AlertCircle className="h-4 w-4" /><span>{linkError}</span></div>}
                {linkStep === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-2"><Label className="text-white">Email Address</Label><Input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} className="bg-white/5 border-white/10 focus:border-[#00d4ff] h-12 text-white" /></div>
                    <div className="space-y-2"><Label className="text-white">Account Password</Label><Input type="password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} className="bg-white/5 border-white/10 focus:border-[#00d4ff] h-12 text-white" /></div>
                    <Button onClick={handleStartLinking} disabled={isLinking || !linkEmail || linkPassword.length < 6} className="w-full bg-[#00d4ff] hover:bg-[#0099cc] text-black font-bold h-12 mt-4 transition-all">Link Account</Button>
                  </div>
                ) : (
                  <div className="space-y-6 text-center"><div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mx-auto mb-2"><Send className="w-8 h-8" /></div><p className="text-sm text-gray-400 italic font-medium">Please check your inbox for the link.</p><Button onClick={closeLinkDialog} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold h-12 border border-white/10 transition-all">Got it</Button></div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
          <DialogContent className="bg-[#141414] border-white/10 text-white p-8 max-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4"><AlertCircle className="w-8 h-8" /></div>
            <DialogHeader className="mb-6"><DialogTitle className="text-xl font-bold text-white">Unlink Account?</DialogTitle><DialogDescription className="text-gray-400 text-sm">Remove your <strong>{unlinkingProvider?.name}</strong> account identity?</DialogDescription></DialogHeader>
            <div className="flex flex-col gap-3">
              <Button onClick={handleUnlink} disabled={isLinking} className="bg-red-500 hover:bg-red-600 text-white font-bold h-12 transition-all">Confirm Unlink</Button>
              <Button variant="ghost" onClick={() => setIsUnlinkDialogOpen(false)} className="text-gray-400 hover:text-white transition-colors">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
