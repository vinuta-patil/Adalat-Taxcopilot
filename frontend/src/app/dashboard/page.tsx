import React from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart4, Check, FileText, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

export default function DashboardPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of your case analyses and predictions
            </p>
          </div>
          <Link href="/analysis">
            <Button>
              New Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cases Analyzed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground">
                +12 from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Appeal Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.7%</div>
              <Progress value={23.7} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Resources Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹17.2M</div>
              <p className="text-xs text-muted-foreground">
                Estimated from avoided unnecessary appeals
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList>
            <TabsTrigger value="recent">Recent Cases</TabsTrigger>
            <TabsTrigger value="recommended">Recommended Appeals</TabsTrigger>
            <TabsTrigger value="not-recommended">Not Recommended</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="border rounded-md mt-6">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Case Analyses</h2>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
              <Separator className="my-4" />
              
              {/* Case list */}
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-start gap-4">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Tax Case #{1000 + i}</h3>
                        <p className="text-sm text-muted-foreground">Income Tax Appeal - ABC Corp</p>
                        <p className="text-xs text-muted-foreground">Analyzed on April {i}, 2025</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {i % 2 === 0 ? (
                          <>
                            <X className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Appeal Not Recommended</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Appeal Recommended</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">Success Probability:</span>
                        <span className="text-xs font-medium">{i % 2 === 0 ? '23%' : '68%'}</span>
                      </div>
                      <Link href={`/analysis/${1000 + i}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recommended" className="border rounded-md mt-6">
            <div className="p-4">
              <h2 className="text-xl font-semibold">Recommended Appeal Cases</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cases with high likelihood of success that are recommended for appeal
              </p>
              <Separator className="my-4" />
              
              {/* Similar content structure as the "recent" tab but with filtered data */}
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <BarChart4 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Placeholder for Recommended Appeals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    In a real application, this would show cases with high success probability
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="not-recommended" className="border rounded-md mt-6">
            <div className="p-4">
              <h2 className="text-xl font-semibold">Not Recommended for Appeal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cases with low likelihood of success that should not be appealed
              </p>
              <Separator className="my-4" />
              
              {/* Similar content structure as the "recent" tab but with filtered data */}
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <BarChart4 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Placeholder for Not Recommended Appeals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    In a real application, this would show cases with low success probability
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
