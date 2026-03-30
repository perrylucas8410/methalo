import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-400">
          <p>Last updated: March 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>By accessing Methalo Browser, you agree to be bound by these terms. If you do not agree, you must not use my service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. Prohibited Uses</h2>
            <p>You agree not to use the browser for any illegal activities, including but not limited to unauthorized access to other systems, distribution of malware, or harassment.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Termination of Service</h2>
            <p>I reserve the right to suspend or terminate your access to the service at any time, for any reason, including violation of these terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
