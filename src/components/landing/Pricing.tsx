"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Starter Plan",
    price: "Free",
    description: "Perfect for trying out CliniSynth",
    features: [
      { name: "3 queries per day", included: true },
      { name: "Basic GRADE assessment", included: true },
      { name: "Limited PDF export", included: true },
      { name: "Advanced meta-analysis", included: false },
      { name: "Priority support", included: false }
    ],
    cta: "Get Started Free",
    popular: false,
    className: "bg-slate-50 border-slate-200"
  },
  {
    name: "Pro Plan",
    price: "$19",
    period: "/month",
    originalPrice: "$29",
    description: "For serious medical professionals",
    features: [
      { name: "Unlimited queries", included: true },
      { name: "Advanced GRADE analysis", included: true },
      { name: "Multi-database search", included: true },
      { name: "Unlimited PDF export", included: true },
      { name: "Upgraded AI model", included: true }
    ],
    cta: "Upgrade to Pro",
    popular: true,
    className: "medical-gradient text-white"
  }
];

export default function Pricing() {
  const router = useRouter();

  const handleGetStarted = (planName: string) => {
    if (planName === "Starter Plan") {
      router.push('/auth/login?redirectedFrom=/chat');
    } else {
      router.push('/auth/login?redirectedFrom=/dashboard');
    }
  };

  const handleViewFullPricing = () => {
    router.push('/pricing');
  };

  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose the plan that fits your research needs. Upgrade or downgrade at any time.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              <Card className={`${plan.className} rounded-2xl p-8 relative overflow-hidden`}>
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <div className="mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <div className={`flex items-baseline mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className={`text-lg font-normal ml-1 ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                        {plan.period}
                      </span>
                    )}
                    {plan.originalPrice && (
                      <span className="text-lg text-blue-200 line-through ml-2">
                        {plan.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className={plan.popular ? 'text-blue-100' : 'text-slate-600'}>
                    {plan.description}
                  </p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className={`mt-1 w-4 h-4 ${plan.popular ? 'text-green-300' : 'text-green-500'}`} />
                      ) : (
                        <X className={`mt-1 w-4 h-4 ${plan.popular ? 'text-blue-200' : 'text-slate-400'}`} />
                      )}
                      <span className={`${
                        feature.included 
                          ? (plan.popular ? 'text-white' : 'text-slate-700')
                          : (plan.popular ? 'text-blue-200' : 'text-slate-400')
                      }`}>
                        {feature.name}
                      </span>
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
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button 
            variant="outline" 
            onClick={handleViewFullPricing}
            className="px-8 py-3 text-lg"
          >
            View Full Pricing Details
          </Button>
          <p className="text-sm text-slate-500 mt-4">
            Compare all features and see detailed pricing information
          </p>
        </motion.div>
      </div>
    </section>
  );
}
