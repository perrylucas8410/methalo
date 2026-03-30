import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { submitSupportTicket } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Shield, Send, CheckCircle } from 'lucide-react';

export default function Support() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    accountEmail: currentUser?.email || '',
    replyEmail: currentUser?.email || '',
    problem: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Save to Firestore
      await submitSupportTicket(formData);

      // 2. Notify via Server (Email & Discord)
      await fetch('/api/support/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-8">
        <Card className="bg-[#141414] border-white/10 text-white max-w-md w-full text-center p-8">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
          <p className="text-gray-400 mb-8">We've received your support request. I will get back to you at the reply email when i solve your problem.</p>
          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-[#00d4ff] hover:bg-[#0099cc] text-black font-bold"
          >
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-8 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0099cc] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Support Request</h1>
        </div>

        <Card className="bg-[#141414] border-white/10 text-white shadow-2xl">
          <CardHeader>
            <CardTitle>Submit a Request</CardTitle>
            <CardDescription className="text-gray-400">Describe your problem and I'll help you fix it.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe" 
                    required 
                    className="bg-white/5 border-white/10 focus:border-[#00d4ff] text-white" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="accountEmail">Account Email</Label>
                    <Input 
                      id="accountEmail" 
                      type="email" 
                      value={formData.accountEmail}
                      onChange={(e) => setFormData({...formData, accountEmail: e.target.value})}
                      placeholder="name@example.com" 
                      required 
                      className="bg-white/5 border-white/10 focus:border-[#00d4ff] text-white" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="replyEmail">Reply Email</Label>
                    <Input 
                      id="replyEmail" 
                      type="email" 
                      value={formData.replyEmail}
                      onChange={(e) => setFormData({...formData, replyEmail: e.target.value})}
                      placeholder="where should I reply?" 
                      required 
                      className="bg-white/5 border-white/10 focus:border-[#00d4ff] text-white" 
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="problem">Describe your problem</Label>
                  <Textarea 
                    id="problem" 
                    value={formData.problem}
                    onChange={(e) => setFormData({...formData, problem: e.target.value})}
                    placeholder="Tell me what's happening..." 
                    required 
                    className="min-h-[150px] bg-white/5 border-white/10 focus:border-[#00d4ff] text-white" 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#00d4ff] hover:bg-[#0099cc] text-black font-bold h-12 transition-all"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
