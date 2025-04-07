"use client"

import React, { useState } from 'react'
import { CaseUpload } from '@/components/case-upload'
import { PredictionCard } from '@/components/prediction-card'
import { useRouter } from 'next/navigation'

const API_URL = 'http://localhost:3001';

export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<any | null>(null);
  const router = useRouter();
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Case Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Upload a case document to get an AI-powered prediction and recommendation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CaseUpload 
              onAnalyze={async (files) => {
                if (!files.length) return;
                
                setIsLoading(true);
                setError(undefined);
                setAnalysis(null);
                
                try {
                  const formData = new FormData();
                  formData.append('document', files[0]);
                  
                  const response = await fetch(`${API_URL}/api/analyze`, {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to analyze document');
                  }
                  
                  const data = await response.json();
                  if (data.success) {
                    setAnalysis(data.analysis);
                  } else {
                    throw new Error(data.error || 'Failed to analyze document');
                  }
                } catch (err: any) {
                  setError(err.message || 'An error occurred during analysis');
                  console.error('Analysis error:', err);
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
              error={error}
            />
            
            {analysis && (
              <div className="mt-6">
                <PredictionCard
                  title={analysis.title || analysis.caseTitle || analysis.fileName || 'Case Analysis'}
                  successProbability={analysis.successProbability || 0}
                  recommendation={analysis.recommendation || 'review'}
                  reasoning={analysis.reasoning || 'Analysis completed successfully.'}
                  onViewFullAnalysis={() => {
                    if (analysis.caseId) {
                      router.push(`/analysis/${analysis.caseId}`);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="p-6 border rounded-lg bg-muted/50">
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <ol className="space-y-4">
              <li className="flex gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                <div>
                  <h3 className="font-medium">Upload Document</h3>
                  <p className="text-sm text-muted-foreground">Upload a lower court case document (PDF, DOC, DOCX, or TXT)</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                <div>
                  <h3 className="font-medium">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">Our AI analyzes the case against 125,000+ historical cases</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                <div>
                  <h3 className="font-medium">Get Prediction</h3>
                  <p className="text-sm text-muted-foreground">View success probability and legal reasoning</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">4</span>
                <div>
                  <h3 className="font-medium">Make Decision</h3>
                  <p className="text-sm text-muted-foreground">Receive a clear recommendation on whether to appeal</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
