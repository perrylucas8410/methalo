import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-400">
          <p>Last updated: March 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Information I Collect</h2>
            <p>I only collect the minimum amount of information necessary to provide my services. This includes your email address and any display names you provide.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. How I Use Your Information</h2>
            <p>Your information is used solely for account management and session isolation. I do not sell your data to third parties.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Security</h2>
            <p>All browser sessions are isolated and data is cleared upon session termination. I employ high-level security measures to protect your account information.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
