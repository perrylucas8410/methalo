import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  adminFetchAllUsers, 
  adminUpdateUser, 
  adminDeleteUser, 
  adminFetchSupportTickets, 
  adminUpdateTicketStatus, 
  adminDeleteTicket,
  type UserData, 
  type SupportTicket 
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { 
  Shield, 
  Users, 
  Monitor, 
  LogOut, 
  Loader2,
  AlertCircle,
  User,
  BarChart3,
  Edit,
  Settings,
  RefreshCcw,
  X,
  Trash2,
  LifeBuoy,
  CheckCircle2,
  Clock,
  Mail,
  Reply,
  Send
} from 'lucide-react';

export default function Admin() {
  const { currentUser, userData, logout } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const [newAccountType, setNewAccountType] = useState<string>('');
  const [newIsAdmin, setNewIsAdmin] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [allUsers, allTickets] = await Promise.all([
        adminFetchAllUsers(),
        adminFetchSupportTickets()
      ]);
      setUsers(allUsers);
      setTickets(allTickets);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData && !userData.isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
    const interval = setInterval(loadData, 10000); 
    return () => clearInterval(interval);
  }, [userData]);

  useEffect(() => {
    if (newAccountType === 'Admin') setNewIsAdmin(true);
  }, [newAccountType]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const openManageUser = (user: UserData) => {
    setEditingUser(user);
    setNewAccountType(user.accountType || 'Free');
    setNewIsAdmin(user.isAdmin || false);
    setIsManageDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await adminUpdateUser(editingUser.uid, { 
        accountType: newAccountType as any, 
        isAdmin: newIsAdmin
      });
      await loadData();
      setIsManageDialogOpen(false);
    } catch { setError('Update failed'); } finally { setIsUpdating(false); }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await adminDeleteUser(editingUser.uid);
      await loadData();
      setIsDeleteDialogOpen(false);
      setIsManageDialogOpen(false);
    } catch { setError('Delete failed'); } finally { setIsUpdating(false); }
  };

  const handleResolveTicket = async (id: string, currentStatus: string) => {
    setIsUpdating(true);
    try {
      await adminUpdateTicketStatus(id, currentStatus === 'pending' ? 'resolved' : 'pending');
      await loadData();
    } catch { setError('Failed to update ticket'); } finally { setIsUpdating(false); }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Permanently delete this ticket?')) return;
    setIsUpdating(true);
    try {
      await adminDeleteTicket(id);
      await loadData();
    } catch { setError('Delete failed'); } finally { setIsUpdating(false); }
  };

  const handleSendReply = async () => {
    if (!replyTicket || !replyMessage) return;
    setIsUpdating(true);
    try {
      await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyEmail: replyTicket.replyEmail,
          userName: replyTicket.fullName,
          message: replyMessage
        })
      });
      await adminUpdateTicketStatus(replyTicket.id!, 'resolved');
      await loadData();
      setIsReplyDialogOpen(false);
      setReplyMessage('');
    } catch { setError('Failed to send reply'); } finally { setIsUpdating(false); }
  };

  if (!currentUser) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col text-white">
      <header className="h-16 border-b border-white/10 bg-[#141414]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,212,255,0.5)] transition-all"><Shield className="w-5 h-5 text-white" /></div>
          <span className="text-xl font-bold text-white group-hover:text-[#00d4ff] transition-colors">Methalo</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white hidden sm:flex items-center gap-2"><Monitor className="h-4 w-4" /><span>Dashboard</span></Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white hidden sm:inline">{userData?.displayName || currentUser.email?.split('@')[0]}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 outline-none"><Avatar className="h-9 w-9 border border-white/10"><AvatarImage src={userData?.photoURL || currentUser?.photoURL || undefined} /><AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#0099cc] text-white">{(userData?.displayName?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}</AvatarFallback></Avatar></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#141414] border-white/10 text-white" align="end">
                <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{userData?.displayName}</p><p className="text-xs leading-none text-gray-400">{currentUser.email}</p></div></DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer"><Monitor className="mr-2 h-4 w-4" /><span>Dashboard</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/contact')} className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Contact</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" /><DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Sign Out</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center justify-between"><div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /><span>{error}</span></div><button onClick={() => setError(null)}><X className="h-4 w-4 opacity-50" /></button></div>}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#141414] border border-white/10 p-1">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Users</TabsTrigger>
            <TabsTrigger value="tickets" className="relative">
              <LifeBuoy className="h-4 w-4 mr-2" /> Support
              {tickets.filter(t => t.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {tickets.filter(t => t.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[ 
                { label: 'Total Users', value: users.length, color: 'text-white' }, 
                { label: 'Open Tickets', value: tickets.filter(t => t.status === 'pending').length, color: 'text-amber-400' }
              ].map((stat, i) => (
                <Card key={i} className="bg-[#141414] border-white/10 shadow-xl"><CardHeader className="pb-2"><CardDescription className="text-[10px] uppercase font-bold text-gray-500">{stat.label}</CardDescription><CardTitle className={`text-3xl font-black italic ${stat.color}`}>{stat.value}</CardTitle></CardHeader></Card>
              ))}
            </div>
            <Card className="bg-[#141414] border-white/10 shadow-2xl"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Settings className="w-5 h-5 text-[#00d4ff]" /> Global Controls</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-4"><Button onClick={loadData} variant="outline" className="border-white/10 font-bold"><RefreshCcw className="mr-2 h-4 w-4" /> Refresh All</Button></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-[#141414] border-white/10 shadow-2xl">
              <CardHeader><CardTitle>User Directory</CardTitle></CardHeader>
              <CardContent><div className="space-y-3">
                {loading && users.length === 0 ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[#00d4ff]" /></div> :
                  users.map(user => (
                    <div key={user.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-lg flex items-center justify-center border border-white/10 bg-white/5">{user.photoURL ? <img src={user.photoURL} className="w-12 h-12 rounded-lg object-cover" /> : <User className="w-5 h-5 text-gray-500" />}</div><div><div className="flex items-center gap-2"><p className="font-bold text-white text-sm">{user.displayName}</p><Badge className="bg-[#00d4ff]/10 text-[#00d4ff] text-[8px] uppercase">{user.accountType || 'Free'}</Badge></div><p className="text-xs text-gray-500">{user.email}</p></div></div>
                      <Button onClick={() => openManageUser(user)} variant="outline" size="sm" className="border-white/10 text-white hover:bg-[#00d4ff] hover:text-black font-bold h-8 gap-2 px-4"><Edit className="w-3 h-3 mr-2" /> Manage</Button>
                    </div>
                  ))}
              </div></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6 animate-in slide-in-from-bottom-2">
            <Card className="bg-[#141414] border-white/10 shadow-2xl">
              <CardHeader><CardTitle className="flex items-center justify-between">Support Tickets <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500 uppercase">{tickets.length} Total</Badge></CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading && tickets.length === 0 ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[#00d4ff]" /></div> :
                    tickets.length === 0 ? <div className="text-center py-12 text-gray-600 italic font-medium">No support requests yet</div> :
                    tickets.map(ticket => (
                      <div key={ticket.id} className={`p-6 rounded-2xl border ${ticket.status === 'resolved' ? 'bg-black/20 border-white/5 opacity-60' : 'bg-white/5 border-white/10'} transition-all`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ticket.status === 'resolved' ? 'bg-gray-500/10 text-gray-500' : 'bg-[#00d4ff]/10 text-[#00d4ff]'}`}>
                              {ticket.status === 'resolved' ? <CheckCircle2 className="w-6 h-6" /> : <LifeBuoy className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">{ticket.fullName}</h3>
                                <Badge className={ticket.status === 'resolved' ? "bg-gray-500/20 text-gray-400" : "bg-amber-500/20 text-amber-400"}>
                                  {ticket.status === 'pending' ? 'Open' : 'Resolved'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3" /> {ticket.replyEmail} 
                                <span className="text-gray-700">|</span> 
                                <Clock className="w-3 h-3" /> {ticket.createdAt?.toDate().toLocaleString() || 'Just now'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => { setReplyTicket(ticket); setIsReplyDialogOpen(true); }}
                              variant="outline" 
                              size="sm" 
                              className="border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff] hover:text-black font-bold h-8 gap-2"
                            >
                              <Reply className="w-3 h-3" /> Reply
                            </Button>
                            <Button 
                              onClick={() => ticket.id && handleResolveTicket(ticket.id, ticket.status)} 
                              variant="ghost" 
                              size="sm" 
                              className={ticket.status === 'pending' ? "text-green-400 hover:bg-green-500/10" : "text-gray-400 hover:bg-white/5"}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => ticket.id && handleDeleteTicket(ticket.id)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                          <p className="text-sm text-gray-300 leading-relaxed italic">"{ticket.problem}"</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reply Dialog */}
        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent className="bg-[#141414] border-white/10 text-white shadow-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic flex items-center gap-3 text-[#00d4ff]">
                <Reply className="w-6 h-6" /> Reply to {replyTicket?.fullName}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Sending to: <span className="text-white font-bold">{replyTicket?.replyEmail}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-gray-500">Response Message</Label>
                <Textarea 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your personal response here..."
                  className="min-h-[200px] bg-white/5 border-white/10 focus:border-[#00d4ff] text-white"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsReplyDialogOpen(false)} className="font-bold text-gray-500">Cancel</Button>
              <Button 
                onClick={handleSendReply} 
                disabled={isUpdating || !replyMessage}
                className="bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black font-black px-8 gap-2"
              >
                {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" /> Send Reply</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="bg-[#141414] border-white/10 text-white shadow-2xl max-w-md">
            <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3 text-[#00d4ff]"><Edit className="w-6 h-6" /> Manage User</DialogTitle><DialogDescription className="text-gray-500">Modify user tier and administrative status.</DialogDescription></DialogHeader>
            <div className="py-6 space-y-8">
              <div className="space-y-3"><Label className="text-xs font-black uppercase text-gray-500">Account Tier</Label><Select value={newAccountType} onValueChange={setNewAccountType}><SelectTrigger className="bg-white/5 border-white/10 text-white h-12"><SelectValue placeholder="Select Plan" /></SelectTrigger><SelectContent className="bg-[#1a1a1a] border-white/10 text-white"><SelectItem value="Free">Free Plan</SelectItem><SelectItem value="Pro">Pro Plan</SelectItem><SelectItem value="Enterprise">Enterprise</SelectItem><SelectItem value="Admin">Administrator</SelectItem></SelectContent></Select></div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"><div className="space-y-0.5"><Label className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400" /> Admin Access</Label><p className="text-xs text-gray-500">Enable management rights</p></div><Switch checked={newIsAdmin} onCheckedChange={setNewIsAdmin} className="data-[state=checked]:bg-[#00d4ff]" /></div>
              <Separator className="bg-white/5" /><div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20"><p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Danger Zone</p><Button onClick={() => setIsDeleteDialogOpen(true)} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white font-bold h-10 gap-2"><Trash2 className="w-4 h-4" /> Delete Account</Button></div>
            </div>
            <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setIsManageDialogOpen(false)} className="font-bold text-gray-500">Cancel</Button><Button onClick={handleUpdateUser} disabled={isUpdating} className="bg-[#00d4ff] hover:bg-[#0099cc] text-black font-black px-8">Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-[#141414] border-white/10 text-white p-8 max-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4"><AlertCircle className="w-8 h-8" /></div>
            <DialogHeader className="mb-6"><DialogTitle className="text-xl font-bold text-white">Delete User?</DialogTitle><DialogDescription className="text-gray-400 text-sm text-center">Are you sure you want to permanently delete <strong>{editingUser?.displayName}</strong>? This action is permanent.</DialogDescription></DialogHeader>
            <div className="flex flex-col gap-3"><Button onClick={handleDeleteUser} disabled={isUpdating} className="bg-red-500 hover:bg-red-600 text-white font-bold h-12">Confirm Deletion</Button><Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-gray-400 hover:text-white">Cancel</Button></div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
