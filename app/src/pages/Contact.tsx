import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Mail, Phone, MessageSquare, ExternalLink, LifeBuoy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Contact() {
  const navigate = useNavigate();

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
          <h1 className="text-3xl font-bold">Get in Touch</h1>
        </div>

        <Card className="bg-[#141414] border-white/10 text-white shadow-2xl">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription className="text-gray-400">Reach out to me through any of these channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email Me</p>
                    <p className="font-medium text-white">perrylucas8410@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Call Me</p>
                    <p className="font-medium text-white">+1 903-452-1254</p>
                  </div>
                </div>
              </div>

              {/* Discord */}
              <a href="https://discord.gg/HHquAN6TyD" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Discord</p>
                    <p className="font-medium text-white group-hover:text-[#5865F2] transition-colors text-white">Join my Community</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
              </a>
            </div>

            <Separator className="bg-white/10" />

            <div className="pt-2">
              <h3 className="text-lg font-semibold mb-4">Technical Support</h3>
              <p className="text-sm text-gray-400 mb-6">If you're experiencing issues with the browser, please submit a detailed support request.</p>
              <Button 
                onClick={() => navigate('/support')}
                className="w-full bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black font-bold h-12"
              >
                <LifeBuoy className="mr-2 h-5 w-5" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
