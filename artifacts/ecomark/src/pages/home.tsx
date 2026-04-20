import React, { useState } from "react";
import { useCalculateFootprint } from "@workspace/api-client-react";
import { Leaf, Car, Utensils, Zap, ShoppingBag, ArrowRight, RotateCcw, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FootprintInputTransport, FootprintInputDiet, FootprintInputEnergy, FootprintInputShopping, FootprintInput } from "@workspace/api-zod";

type FormData = FootprintInput;

const STEPS = [
  {
    id: "transport",
    title: "How do you usually get around?",
    icon: <Car className="w-6 h-6 text-primary" />,
    options: [
      { value: "car", label: "Mostly driving a personal car", description: "Gas or diesel vehicle for most trips" },
      { value: "public_transport", label: "Public transit", description: "Buses, trains, subways frequently" },
      { value: "walking_biking", label: "Walking or biking", description: "Human-powered transport mostly" },
    ]
  },
  {
    id: "diet",
    title: "What does your diet look like?",
    icon: <Utensils className="w-6 h-6 text-primary" />,
    options: [
      { value: "meat_based", label: "Meat-heavy", description: "Meat in most meals daily" },
      { value: "mixed", label: "Mixed / Flexitarian", description: "Balanced mix, occasional meat" },
      { value: "vegetarian_vegan", label: "Vegetarian or Vegan", description: "Plant-based entirely or mostly" },
    ]
  },
  {
    id: "energy",
    title: "How's your home energy use?",
    icon: <Zap className="w-6 h-6 text-primary" />,
    options: [
      { value: "high", label: "High usage", description: "Large home, lots of AC/heating" },
      { value: "medium", label: "Moderate usage", description: "Average home, mindful usage" },
      { value: "low", label: "Low usage", description: "Small space, strict conservation" },
    ]
  },
  {
    id: "shopping",
    title: "What are your shopping habits?",
    icon: <ShoppingBag className="w-6 h-6 text-primary" />,
    options: [
      { value: "frequent", label: "Frequent buyer", description: "Often buy new clothes & items" },
      { value: "moderate", label: "Occasional buyer", description: "Buy when needed, some treats" },
      { value: "minimal", label: "Minimalist", description: "Rarely buy new, prefer secondhand" },
    ]
  }
];

export default function Home() {
  const { toast } = useToast();
  const calculateMutation = useCalculateFootprint();
  
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [result, setResult] = useState<any | null>(null);

  const handleSelect = (stepId: string, value: string) => {
    setFormData(prev => ({ ...prev, [stepId]: value }));
  };

  const isFormComplete = STEPS.every(step => formData[step.id as keyof FormData]);

  const handleSubmit = () => {
    if (!isFormComplete) return;
    
    calculateMutation.mutate(
      { data: formData as FormData },
      {
        onSuccess: (data) => {
          setResult(data);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem calculating your footprint. Please try again.",
          });
        }
      }
    );
  };

  const handleReset = () => {
    setFormData({});
    setResult(null);
    calculateMutation.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
      <header className="py-6 px-6 sm:px-10 border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Leaf className="w-6 h-6" />
          EcoMark
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-20 pb-32">
        {result ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-4">
                <Leaf className="w-12 h-12" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Your Impact</h1>
              <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                Here's a breakdown of your estimated carbon footprint and how you can improve.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="p-8 flex flex-col items-center justify-center text-center border-2 border-primary/20 bg-primary/5 shadow-lg shadow-primary/5">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Estimated Score</p>
                <div className="text-6xl font-bold text-foreground mb-4">{result.score}</div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                  result.category === 'green_hero' ? 'bg-green-100 text-green-800 border border-green-200' :
                  result.category === 'improving' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-orange-100 text-orange-800 border border-orange-200'
                }`}>
                  {result.categoryLabel}
                </div>
              </Card>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Personalized Tips</h3>
                <div className="space-y-4">
                  {result.tips.map((tip: string, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-card border shadow-sm">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <Button size="lg" variant="outline" onClick={handleReset} className="gap-2 h-14 px-8 rounded-full text-base border-2 hover:bg-secondary">
                <RotateCcw className="w-5 h-5" />
                Calculate Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Discover your environmental footprint.</h1>
              <p className="text-lg text-muted-foreground">
                Answer a few simple questions to see your impact and get actionable tips for a greener lifestyle.
              </p>
            </div>

            <div className="space-y-10">
              {STEPS.map((step, index) => (
                <Card key={step.id} className="p-6 sm:p-8 shadow-sm border-border/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {step.icon}
                    </div>
                    <h2 className="text-xl font-semibold">{step.title}</h2>
                  </div>
                  
                  <RadioGroup 
                    onValueChange={(val) => handleSelect(step.id, val)} 
                    value={formData[step.id as keyof FormData]}
                    className="grid sm:grid-cols-3 gap-4"
                  >
                    {step.options.map((opt) => {
                      const isSelected = formData[step.id as keyof FormData] === opt.value;
                      return (
                        <div key={opt.value}>
                          <RadioGroupItem
                            value={opt.value}
                            id={`${step.id}-${opt.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${step.id}-${opt.value}`}
                            className={`
                              flex flex-col h-full p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                              hover:border-primary/40 hover:bg-primary/5
                              ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/60 bg-card'}
                            `}
                          >
                            <span className="font-semibold text-foreground block mb-2">{opt.label}</span>
                            <span className="text-sm text-muted-foreground leading-relaxed mt-auto">{opt.description}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </Card>
              ))}
            </div>

            {calculateMutation.isError && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  There was a problem calculating your score. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center pt-8">
              <Button 
                size="lg" 
                onClick={handleSubmit} 
                disabled={!isFormComplete || calculateMutation.isPending}
                className="h-14 px-10 rounded-full text-lg gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {calculateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Reveal My Impact
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
            
            {!isFormComplete && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Please answer all questions to see your results.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}