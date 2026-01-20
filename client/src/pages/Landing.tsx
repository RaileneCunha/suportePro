import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, MessageSquare, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="font-bold text-white">S</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-900">SupportPro</span>
          </div>
          <a href="/login">
            <Button>Sign In</Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 animate-slide-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: AI-Powered Responses
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 tracking-tight mb-6 animate-slide-in" style={{ animationDelay: '100ms' }}>
            Customer support <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(217,85%,45%)] to-[hsl(45,95%,50%)]">reimagined for speed</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 animate-slide-in" style={{ animationDelay: '200ms' }}>
            Streamline your support workflow with our intelligent help desk. 
            Automate routine tasks, empower your team, and delight your customers.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in" style={{ animationDelay: '300ms' }}>
            <a href="/login">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-slate-200">
              View Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Omnichannel Support</h3>
              <p className="text-slate-600 leading-relaxed">
                Manage conversations from email, chat, and social media in one unified inbox. Never miss a customer query again.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Automation</h3>
              <p className="text-slate-600 leading-relaxed">
                Let AI handle routine questions and draft responses for your agents. Reduce response times by up to 50%.
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Bank-grade encryption, SSO, and granular role-based access control to keep your customer data safe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="font-bold text-white text-xs">S</span>
            </div>
            <span className="font-bold text-white">SupportPro</span>
          </div>
          <p className="text-sm">© 2024 SupportPro Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
