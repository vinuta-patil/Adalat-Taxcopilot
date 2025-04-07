"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FileText, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { PredictionCard } from '@/components/prediction-card'

export default function CaseAnalysisPage({ params }: { params: { id: string } }) {
  const caseId = params.id;
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [caseData, setCaseData] = React.useState<any>(null);
  
  const API_URL = 'http://localhost:3001';
  
  React.useEffect(() => {
    const fetchCaseData = async () => {
      try {
        console.log('Starting to fetch case data');
        console.log(`Case ID: ${caseId}`);
        console.log(`API URL: ${API_URL}`);
        const requestUrl = `${API_URL}/api/cases/${caseId}`;
        console.log(`Full request URL: ${requestUrl}`);
        
        setIsLoading(true);
        setError(null);
        
        // Fetch case details from the API
        console.log('Sending fetch request...');
        const response = await fetch(requestUrl);
        console.log('Fetch response received');
        console.log(`Response status: ${response.status} ${response.statusText}`);
        // Log response headers in a TypeScript-friendly way
        const headerObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headerObj[key] = value;
        });
        console.log('Response headers:', headerObj);
        
        if (!response.ok) {
          console.error(`Error response: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch case data: ${response.statusText}`);
        }
        
        console.log('Parsing response JSON...');
        const data = await response.json();
        console.log('Response data:', data);
        
        // Log what we're getting from the API
        console.log('FULL API RESPONSE:', data);
        
        // Check if there was an error in the analysis
        let hasTextExtractionError = false;
        let errorMessage = '';
        
        // Check for text extraction limitations in rawAnalysis
        if (data.rawAnalysis && data.rawAnalysis.includes('text extraction limitations')) {
          try {
            const rawObj = JSON.parse(data.rawAnalysis.trim());
            if (rawObj.error) {
              hasTextExtractionError = true;
              errorMessage = rawObj.error;
            }
          } catch (e) {
            // If not valid JSON, check if it contains error text
            if (data.rawAnalysis.includes('error') && data.rawAnalysis.includes('text extraction limitations')) {
              hasTextExtractionError = true;
              errorMessage = 'Unable to analyze the document due to text extraction limitations.';
            }
          }
        }
        
        // Transform backend data to match our UI requirements
        const formattedData = {
          id: data.caseId || caseId,
          title: data.caseTitle || data.title || data.fileName || 'Case Analysis',
          caseNumber: data.caseNumber || 'N/A',
          courtLevel: data.courtLevel || 'N/A',
          dateOfOrder: data.dateOfOrder || new Date().toISOString().split('T')[0],
          successProbability: data.successProbability || 50,
          recommendation: (data.recommendation || 'review') as 'appeal' | 'dont-appeal' | 'review',
          reasoning: data.reasoning || 'No detailed reasoning provided.',
          keyIssues: Array.isArray(data.keyIssues) ? data.keyIssues : [],
          statutoryProvisions: Array.isArray(data.statutoryProvisions) ? data.statutoryProvisions : [],
          keyPrecedents: Array.isArray(data.keyPrecedents) ? data.keyPrecedents : [],
          potentialOutcome: data.potentialOutcome || '',
          rawAnalysis: data.rawAnalysis || '',
          precedentAnalysis: data.precedentAnalysis || '',
          caseSummary: data.reasoning || data.rawAnalysis || data.potentialOutcome || '',
          hasTextExtractionError,
          errorMessage
        };
        
        console.log('FORMATTED DATA FOR UI:', formattedData);
        
        setCaseData(formattedData);
      } catch (err: any) {
        console.error('Error fetching case data:', err);
        setError(err.message || 'Failed to load case data');
        
        // Fallback to default data if API fails
        setCaseData({
          id: caseId,
          title: 'Case Analysis',
          caseNumber: 'N/A',
          courtLevel: 'N/A',
          dateOfOrder: new Date().toISOString().split('T')[0],
          successProbability: 50,
          recommendation: 'review' as 'appeal' | 'dont-appeal' | 'review',
          reasoning: 'Analysis data could not be loaded. Please try again later.',
          keyIssues: [],
          statutoryProvisions: [],
          keyPrecedents: [],
          potentialOutcome: ''
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCaseData();
  }, [caseId]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading case analysis...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !caseData) {
    return (
      <div className="container py-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href="/analysis">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Error Loading Case</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 mb-2">Failed to load case analysis</p>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/analysis" className="mt-4 inline-block">
              <Button>Return to Analysis</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/analysis">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{caseData?.title || 'Case Analysis'}</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="legal-analysis">Legal Analysis</TabsTrigger>
                <TabsTrigger value="precedents">Precedents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Information</CardTitle>
                    <CardDescription>Details of the case under analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Case Number</p>
                        <p className="text-sm text-muted-foreground">{caseData.caseNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Court Level</p>
                        <p className="text-sm text-muted-foreground">{caseData.courtLevel}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date of Order</p>
                        <p className="text-sm text-muted-foreground">{caseData.dateOfOrder}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Assessed By</p>
                        <p className="text-sm text-muted-foreground">Tax Litigation CoPilot AI</p>
                      </div>
                    </div>

                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Key Issues</h3>
                      <ul className="space-y-1">
                        {caseData.keyIssues.map((issue: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="rounded-full bg-primary h-1.5 w-1.5 mt-1.5" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Statutory Provisions</h3>
                      <ul className="space-y-1">
                        {caseData.statutoryProvisions.map((provision: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="rounded-full bg-primary h-1.5 w-1.5 mt-1.5" />
                            <span>{provision}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Case Summary</CardTitle>
                    <CardDescription>AI-generated summary of the case</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {caseData.hasTextExtractionError ? (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h3 className="text-amber-800 text-sm font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Text Extraction Limitation
                          </h3>
                          <p className="text-sm text-amber-700 mt-2">{caseData.errorMessage || 'Unable to extract sufficient text from this PDF for analysis.'}</p>
                          <p className="text-sm text-amber-700 mt-2">This document appears to be an image-based PDF that requires OCR (Optical Character Recognition) processing.</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="text-sm font-medium mb-2">Recommendations:</h3>
                          <ul className="text-sm text-muted-foreground space-y-2">
                            <li>• Upload a text-based PDF if available</li>
                            <li>• Use OCR software to convert the document to a searchable PDF</li>
                            <li>• Manually transcribe key sections of the document for analysis</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {caseData.caseSummary || caseData.rawAnalysis || caseData.potentialOutcome || caseData.reasoning || 
                        'No detailed case summary is available for this case. Please analyze the document for more information.'}
                      </p>
                    )}
                    {/* Debug info - remove in production */}
                    <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                      <details>
                        <summary className="cursor-pointer font-medium">Debug Info</summary>
                        <p className="mt-2">Has reasoning: {caseData.reasoning ? 'Yes' : 'No'}</p>
                        <p>Has rawAnalysis: {caseData.rawAnalysis ? 'Yes' : 'No'}</p>
                        <p>Has potentialOutcome: {caseData.potentialOutcome ? 'Yes' : 'No'}</p>
                        <p>Has caseSummary: {caseData.caseSummary ? 'Yes' : 'No'}</p>
                        
                        <p className="mt-4 font-medium">Field Contents:</p>
                        <p className="mt-2">reasoning: <span className="text-blue-600">"{caseData.reasoning}"</span></p>
                        <p>rawAnalysis: <span className="text-blue-600">"{caseData.rawAnalysis}"</span></p>
                        <p>potentialOutcome: <span className="text-blue-600">"{caseData.potentialOutcome}"</span></p>
                        <p>caseSummary: <span className="text-blue-600">"{caseData.caseSummary}"</span></p>
                      </details>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="legal-analysis" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Analysis</CardTitle>
                    <CardDescription>Detailed legal reasoning and prediction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Legal Reasoning</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseData.reasoning}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Potential Outcome</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseData.potentialOutcome}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Success Probability Analysis</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Likelihood of Success on Appeal</span>
                          <span className="text-sm font-medium">{caseData.successProbability}%</span>
                        </div>
                        <Progress value={caseData.successProbability} 
                          className={caseData.successProbability > 70 ? "bg-green-100" : 
                            caseData.successProbability > 40 ? "bg-yellow-100" : "bg-red-100"
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on analysis of similar cases and precedents from higher courts.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Model Court Opinion</CardTitle>
                    <CardDescription>Predicted opinion if case is appealed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-stone dark:prose-invert prose-sm max-w-none">
                      {caseData.potentialOutcome ? (
                        <p>{caseData.potentialOutcome}</p>
                      ) : (
                        <p>No model court opinion is available for this case. This may be due to insufficient data in the original document or limitations in the AI analysis.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="precedents" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Relevant Precedents</CardTitle>
                    <CardDescription>Key cases that impact the prediction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(caseData.keyPrecedents) && caseData.keyPrecedents.map((precedent: {case: string, relevance: string}, i: number) => (
                      <div key={i} className="border rounded-md p-4">
                        <div className="flex gap-4">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{precedent.case}</h3>
                            <p className="text-sm text-muted-foreground">{precedent.relevance}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Precedent Analysis</CardTitle>
                    <CardDescription>How precedents apply to this case</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {caseData.precedentAnalysis ? (
                      <p className="text-sm text-muted-foreground">{caseData.precedentAnalysis}</p>
                    ) : Array.isArray(caseData.keyPrecedents) && caseData.keyPrecedents.length > 0 ? (
                      <div>
                        {caseData.keyPrecedents.map((precedent: {case: string, relevance: string}, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground mb-4">
                            <strong>{precedent.case}</strong>: {precedent.relevance}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No precedent analysis is available for this case. The analysis engine could not identify relevant case law
                        that significantly impacts the outcome prediction.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <PredictionCard 
              title={caseData.title}
              successProbability={caseData.successProbability}
              recommendation={caseData.recommendation}
              reasoning={caseData.reasoning}
              onViewFullAnalysis={() => {
                // Open a new window/tab with the full analysis data
                const detailWindow = window.open('', '_blank');
                if (detailWindow) {
                  detailWindow.document.write(`
                    <html>
                      <head>
                        <title>Full Analysis - ${caseData.title || 'Case Analysis'}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 2rem; max-width: 900px; margin: 0 auto; }
                          h1 { font-size: 1.5rem; margin-bottom: 1rem; }
                          h2 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 0.5rem; }
                          pre { background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow: auto; }
                          .back { display: inline-block; margin-bottom: 1rem; color: #0066cc; text-decoration: none; }
                          .data-block { background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
                        </style>
                      </head>
                      <body>
                        <a href="#" class="back" onclick="window.close(); return false;">← Back to Case</a>
                        <h1>Full Analysis: ${caseData.title || 'Case Analysis'}</h1>
                        
                        <div class="data-block">
                          <p><strong>Case ID:</strong> ${caseData.caseId || params.id}</p>
                          <p><strong>Case Number:</strong> ${caseData.caseNumber || 'N/A'}</p>
                          <p><strong>Court Level:</strong> ${caseData.courtLevel || 'N/A'}</p>
                          <p><strong>Date of Order:</strong> ${caseData.dateOfOrder || 'N/A'}</p>
                          <p><strong>Success Probability:</strong> ${caseData.successProbability || 50}%</p>
                          <p><strong>Recommendation:</strong> ${caseData.recommendation || 'review'}</p>
                        </div>

                        <h2>Reasoning</h2>
                        <p>${caseData.reasoning || 'No detailed reasoning provided.'}</p>

                        <h2>Key Issues</h2>
                        <ul>
                          ${Array.isArray(caseData.keyIssues) && caseData.keyIssues.length > 0 
                            ? caseData.keyIssues.map((issue: string) => `<li>${issue}</li>`).join('\n') 
                            : '<li>No key issues identified</li>'}
                        </ul>

                        <h2>Statutory Provisions</h2>
                        <ul>
                          ${Array.isArray(caseData.statutoryProvisions) && caseData.statutoryProvisions.length > 0 
                            ? caseData.statutoryProvisions.map((provision: string) => `<li>${provision}</li>`).join('\n') 
                            : '<li>No statutory provisions identified</li>'}
                        </ul>
                        
                        <h2>Potential Outcome</h2>
                        <p>${caseData.potentialOutcome || 'No potential outcome provided.'}</p>
                        
                        <h2>Raw Analysis Data</h2>
                        <pre>${JSON.stringify(caseData, null, 2)}</pre>
                      </body>
                    </html>
                  `);
                  detailWindow.document.close();
                } else {
                  alert('Popup blocked. Please allow popups for this site to view the full analysis.');
                }
              }}
            />
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Document Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Original Case Document</p>
                      <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">
                      Download Original
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant={caseData.recommendation === 'appeal' ? 'default' : 'outline'}>
                    <Scale className="mr-2 h-4 w-4" />
                    Appeal Case
                  </Button>
                  <Button className="w-full" variant={caseData.recommendation === 'dont-appeal' ? 'default' : 'outline'}>
                    <Scale className="mr-2 h-4 w-4" />
                    Close Case
                  </Button>
                  <Button className="w-full" variant="outline">
                    Export Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
