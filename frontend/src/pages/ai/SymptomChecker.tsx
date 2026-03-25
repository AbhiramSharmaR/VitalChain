import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertCircle, CheckCircle, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MainLayout } from '@/components/layouts/MainLayout';
import { cn } from '@/lib/utils';

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
  'Dizziness', 'Chest Pain', 'Shortness of Breath', 'Joint Pain',
  'Sore Throat', 'Runny Nose', 'Body Aches', 'Loss of Appetite',
  'Insomnia', 'Anxiety', 'Stomach Pain', 'Vomiting', 'Diarrhea',
];

// -----------------------------
// Backend Response Types
// -----------------------------
type ApiResponse = {
  top_condition: string;
  confidence: number;
  alternatives: { name: string; confidence: number }[];
  severity: string;
};

const SymptomChecker = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ApiResponse | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // -----------------------------
  // API CALL
  // -----------------------------
  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) return;

    setIsAnalyzing(true);
    setResults(null);

    try {
      // Normalize symptoms to backend format
      const normalizedSymptoms = selectedSymptoms.map((s) =>
        s.toLowerCase().trim()
      );

      const response = await fetch('http://localhost:8000/symptomchecker/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: normalizedSymptoms,
          description: additionalInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze symptoms');
      }

      const data: ApiResponse = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'bg-success/10 text-success border-success/30';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Symptom Checker
          </h1>
          <p className="text-muted-foreground">
            Select your symptoms and get AI-powered health insights
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Symptom Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Symptoms</CardTitle>
              <CardDescription>
                Choose all symptoms you're experiencing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                      selectedSymptoms.includes(symptom)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                    )}
                  >
                    {symptom}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Information
                </label>
                <Textarea
                  placeholder="Describe any other symptoms or relevant information..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedSymptoms.length} symptoms selected
                </p>
                <Button
                  variant="gradient"
                  onClick={handleAnalyze}
                  disabled={selectedSymptoms.length === 0 || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyze Symptoms
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                AI-powered health assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!results && !isAnalyzing && (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select symptoms and click analyze
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      to get AI-powered insights
                    </p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <p className="font-medium">Analyzing symptoms...</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI is processing your inputs
                    </p>
                  </div>
                </div>
              )}

              {results && !isAnalyzing && (
                <div className="space-y-6">
                  {/* Severity */}
                  <div
                    className={cn(
                      'p-4 rounded-lg border',
                      getSeverityColor(results.severity)
                    )}
                  >
                    <div className="flex items-center gap-2">
                       {results.severity.toLowerCase() === 'low' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium capitalize">
                        {results.severity} Risk
                      </span>
                    </div>
                  </div>

                  {/* Top Condition */}
                  <div>
                    <p className="text-sm font-medium mb-3">Top Condition Match</p>
                    <div className="mb-4">
                      <div className="flex justify-between text-base mb-1 font-bold">
                        <span>{results.top_condition}</span>
                        <span>{results.confidence.toFixed(1)}%</span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden shadow-inner">
                        <div
                           className={cn("h-full rounded-full transition-all duration-1000", results.severity.toLowerCase() === "high" ? "bg-red-500" : results.severity.toLowerCase() === "medium" ? "bg-yellow-500" : "bg-green-500")}
                           style={{ width: `${results.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Alternatives */}
                    {results.alternatives.length > 0 && (
                      <div className="mt-6 border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground mb-3 font-medium">Other Possibilities</p>
                        <div className="space-y-4">
                          {results.alternatives.map((alt) => (
                            <div key={alt.name}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{alt.name}</span>
                                <span className="text-muted-foreground">{alt.confidence.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/40 rounded-full transition-all duration-1000"
                                  style={{ width: `${alt.confidence}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground border-t border-border pt-4">
                    ⚠️ This is not a medical diagnosis. Please consult a healthcare professional for proper medical advice.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default SymptomChecker;
