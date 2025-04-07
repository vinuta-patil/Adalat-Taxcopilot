"use client"

import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { cn } from '@/lib/utils'

interface PredictionCardProps {
  title: string
  successProbability: number
  recommendation: 'appeal' | 'dont-appeal' | 'review'
  reasoning: string
  onViewFullAnalysis: () => void
}

export function PredictionCard({ 
  title, 
  successProbability, 
  recommendation, 
  reasoning,
  onViewFullAnalysis
}: PredictionCardProps) {
  const getRecommendationData = () => {
    switch (recommendation) {
      case 'appeal':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
          title: 'Appeal Recommended',
          description: 'This case has a high likelihood of success on appeal.',
          color: 'bg-green-500'
        }
      case 'dont-appeal':
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: 'Appeal Not Recommended',
          description: 'This case has a low likelihood of success on appeal.',
          color: 'bg-red-500'
        }
      case 'review':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
          title: 'Further Review Needed',
          description: 'This case requires additional expert review before deciding.',
          color: 'bg-yellow-500'
        }
    }
  }

  const recommendationData = getRecommendationData()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Case Prediction Analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Success Probability</span>
            <span className="text-sm font-medium">{successProbability}%</span>
          </div>
          <Progress value={successProbability} 
            className={cn("h-2", 
              successProbability > 70 ? "bg-green-100" : 
              successProbability > 40 ? "bg-yellow-100" : "bg-red-100"
            )}
          />
        </div>

        <div className="rounded-md border p-4">
          <div className="flex items-start gap-4">
            {recommendationData.icon}
            <div>
              <h3 className="font-semibold">{recommendationData.title}</h3>
              <p className="text-sm text-muted-foreground">{recommendationData.description}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Key Reasoning</h3>
          <p className="text-sm text-muted-foreground">{reasoning}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onViewFullAnalysis} className="w-full">
          View Full Analysis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
