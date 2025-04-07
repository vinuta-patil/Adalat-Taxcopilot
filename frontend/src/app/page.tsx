import React from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart4, Scale, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container py-10">
      <section className="flex flex-col items-center text-center gap-4 py-10">
        <h1 className="text-4xl font-bold tracking-tight">
          Tax Litigation CoPilot
        </h1>
        <p className="text-xl text-muted-foreground max-w-[800px]">
          AI-powered decision support for tax officers to reduce unnecessary litigation
        </p>
        <div className="flex gap-4 mt-6">
          <Link href="/analysis">
            <Button size="lg">
              Start New Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" /> Predict Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-md">
              Forecast higher court rulings with AI trained on thousands of tax cases
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Generate Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-md">
              Get case-specific legal reasoning backed by relevant precedents
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5" /> Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-md">
              Receive data-backed recommendations on whether to appeal a case
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      <section className="py-10">
        <div className="rounded-lg bg-muted p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Why Tax Litigation CoPilot?</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary h-1.5 w-1.5 mt-2" />
                  <span>Reduce unnecessary appeals that have low chances of success</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary h-1.5 w-1.5 mt-2" />
                  <span>Identify high-value cases that are worth pursuing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary h-1.5 w-1.5 mt-2" />
                  <span>Provide objective, data-driven recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary h-1.5 w-1.5 mt-2" />
                  <span>Save time and resources by focusing on merit-based litigation</span>
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>The Problem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    In the Indian judicial system, tax authorities appeal 90% of cases they lose,
                    yet win fewer than 10% of these appeals. This flood of low-merit litigation 
                    paralyzes the entire system, causing delays and wasting resources.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
