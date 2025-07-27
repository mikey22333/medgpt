"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft, Sparkles, Search, TrendingUp, Award, FileText, Clock, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "🆓 Free Plan",
    price: "Free",
    description: "Ideal for basic use and trial experience",
    highlight: "For Everyone",
    features: [
      { name: "3 total queries/day", included: true, description: "Doctor + Research combined daily limit" },
      { name: "Doctor Mode", included: true, description: "Clinical consultation-style responses" },
      { name: "Research Mode", included: true, description: "Academic research and evidence synthesis" },
      { name: "Structured clinical summaries", included: true, description: "Professional medical summaries" },
      { name: "Visual data outputs", included: true, description: "Pie charts, bar graphs, etc." },
      { name: "10 citations per query", included: true, description: "Comprehensive research citations" },
      { name: "PDF export", included: false, description: "Not available on free plan" },
    ],
    cta: "Get Started Free",
    popular: false,
    className: "bg-slate-50 border-slate-200"
  },
  {
    name: "⚡ Pro Plan",
    price: "$12",
    period: "/month",
    description: "Great for medical students, researchers, and clinicians",
    highlight: "For Power Users",
    features: [
      { name: "15 queries/day", included: true, description: "Higher daily limit for professional use" },
      { name: "Everything in Free", included: true, description: "All core features included" },
      { name: "PDF export of research", included: true, description: "Download professional reports" },
      { name: "Citation visual summaries", included: true, description: "Max 20 citations displayed per query" },
      { name: "Visual citation analysis", included: true, description: "View as pie chart or tag clusters" },
      { name: "Faster AI response", included: true, description: "Processing priority for Pro users" },
      { name: "Early access to new features", included: true, description: "Be the first to try new capabilities" }
    ],
    cta: "Upgrade to Pro",
    popular: true,
    className: "bg-blue-600 text-white border-2 border-blue-500"
  }
];

const features = [
  {
    icon: Search,
    title: "Intelligent Literature Search",
    description: "Search across multiple medical databases with AI-powered query optimization"
  },
  {
    icon: TrendingUp,
    title: "Evidence-Based Analysis",
    description: "Automated meta-analysis with effect sizes, confidence intervals, and statistical significance"
  },
  {
    icon: Award,
    title: "GRADE Assessment",
    description: "Systematic quality assessment using the internationally recognized GRADE framework"
  },
  {
    icon: FileText,
    title: "Professional Reports",
    description: "Generate publication-ready PDFs with proper citations and clinical recommendations"
  },
  {
    icon: Clock,
    title: "Time-Saving",
    description: "Reduce literature review time from hours to minutes with AI automation"
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Enterprise-grade security ensuring patient data protection and compliance"
  }
];

const faqs = [
  {
    question: "What medical databases do you search?",
    answer: "We search PubMed, CrossRef, EuropePMC, and OpenAlex to provide comprehensive coverage of medical literature."
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI models are trained on peer-reviewed medical literature and validated by medical professionals. However, always verify findings with clinical judgment."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We follow HIPAA compliance standards and use enterprise-grade encryption to protect all data."
  },
  {
    question: "Do you offer team plans?",
    answer: "Yes! Pro plan includes team collaboration features. Contact us for enterprise pricing for larger teams."
  }
];

export default function PricingPage() {
  const router = useRouter();

  const handleGetStarted = (planName: string) => {
    if (planName === "🆓 Free Plan") {
      router.push('/auth/login?redirectedFrom=/chat');
    } else {
      router.push('/auth/login?redirectedFrom=/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
              <span className="text-slate-600 hover:text-slate-900">Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Logo />
              <span className="text-xl font-bold text-slate-900">CliniSynth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your research needs. Start free and upgrade when you're ready for advanced features.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
            <span className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Cancel anytime
            </span>
            <span className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-500" />
              HIPAA compliant
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className="relative">
                <Card className={`${plan.className} rounded-2xl p-8 relative overflow-hidden ${plan.popular ? 'ring-2 ring-blue-400 shadow-2xl' : 'shadow-lg'}`}>
                  {plan.popular && (
                    <Badge className="absolute top-6 right-6 bg-yellow-500 text-white border-yellow-400 px-3 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <div className={`flex items-baseline mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className={`text-lg font-normal ml-1 ${plan.popular ? 'text-white' : 'text-slate-600'}`}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className={`${plan.popular ? 'text-white' : 'text-slate-600'} mb-3`}>
                      {plan.description}
                    </p>
                    <p className={`text-sm font-medium ${plan.popular ? 'text-white' : 'text-slate-700'}`}>
                      {plan.highlight}
                    </p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className={`mt-1 w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-green-500'}`} />
                        ) : (
                          <X className={`mt-1 w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-white/50' : 'text-slate-400'}`} />
                        )}
                        <div>
                          <span className={`font-medium ${
                            feature.included 
                              ? (plan.popular ? 'text-white' : 'text-slate-700')
                              : (plan.popular ? 'text-white/60' : 'text-slate-400')
                          }`}>
                            {feature.name}
                          </span>
                          <p className={`text-sm ${
                            feature.included 
                              ? (plan.popular ? 'text-white/90' : 'text-slate-500')
                              : (plan.popular ? 'text-white/50' : 'text-slate-400')
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleGetStarted(plan.name)}
                    className={`w-full py-3 font-semibold ${
                      plan.popular 
                        ? 'bg-white text-primary hover:bg-blue-50' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What You Get With CliniSynth
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Powerful features designed specifically for medical professionals and researchers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 h-full hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about CliniSynth.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-slate-600">
                  {faq.answer}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 medical-gradient text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Medical Research?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of medical professionals who are already using AI to accelerate their research and improve patient outcomes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-white text-primary px-8 py-4 text-lg font-semibold hover:bg-blue-50"
              onClick={() => handleGetStarted("🆓 Free Plan")}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white px-8 py-4 text-lg font-semibold hover:bg-white/10"
              onClick={() => router.push('/auth/login')}
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
