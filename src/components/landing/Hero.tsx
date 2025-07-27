"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Rocket, Database, BarChart3, Download } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  const handleTryNowClick = () => {
    // Redirect to the chat page (which will require login)
    router.push('/auth/login?redirectedFrom=/chat');
  };

  const handleWatchDemo = () => {
    // You can implement a demo modal or scroll to demo section
    console.log('Watch demo clicked');
  };

  return (
    <section className="pt-24 pb-20 hero-gradient relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            AI-Powered Medical Research,<br />
            <span className="text-primary">Simplified.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Cut your literature review time in half with automated meta-analyses, confidence scoring, 
            and smart summarization — all in plain English.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
            <Button 
              size="lg" 
              className="medical-gradient text-white px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              onClick={handleTryNowClick}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Try for Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-4 text-lg font-semibold border-2 border-primary/20 hover:border-primary/40 text-slate-700 hover:text-primary bg-white/80 hover:bg-white"
              onClick={handleWatchDemo}
            >
              <Play className="w-5 h-5 mr-2" />
              See How It Works
            </Button>
          </div>
        </motion.div>

        {/* Product Interface Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-6xl mx-auto"
        >
          <Card className="bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
            {/* Interface Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-slate-600">CliniSynth</span>
              </div>
              <div className="text-xs text-slate-500 bg-primary/10 px-2 py-1 rounded">Research Mode</div>
            </div>
            
            {/* Chat Interface */}
            <div className="p-6 h-96 bg-gradient-to-b from-white to-slate-50">
              <div className="space-y-4">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-primary text-white px-4 py-3 rounded-2xl max-w-md">
                    <p className="text-sm">What's the efficacy of statins in preventing cardiovascular disease in elderly patients?</p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex justify-start">
                  <Card className="px-4 py-3 max-w-2xl shadow-sm">
                    <div className="flex items-start space-x-3">
                      <Logo className="flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm text-slate-700"><strong>Evidence Summary (High Certainty - GRADE A)</strong></p>
                        <p className="text-sm text-slate-600">Based on 12 randomized controlled trials (n=45,678), statins reduce cardiovascular events in elderly patients by approximately 22% (RR: 0.78, 95% CI: 0.69-0.88).</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center">
                            <Database className="w-3 h-3 mr-1" />
                            PubMed: 127 studies
                          </span>
                          <span className="flex items-center">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Meta-analysis ready
                          </span>
                          <span className="flex items-center">
                            <Download className="w-3 h-3 mr-1" />
                            Export PDF
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* Typing Indicator */}
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
