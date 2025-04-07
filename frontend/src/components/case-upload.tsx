"use client"

import React, { useState } from 'react'
import { FileUpload } from './ui/file-upload'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { ArrowRight, AlertCircle } from 'lucide-react'

interface CaseUploadProps {
  onAnalyze: (files: File[]) => void
  isLoading: boolean
  error?: string
}

export function CaseUpload({ onAnalyze, isLoading, error }: CaseUploadProps) {
  const [files, setFiles] = useState<File[]>([])

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
  }

  const handleAnalyze = () => {
    if (files.length > 0) {
      onAnalyze(files)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Case Document</CardTitle>
        <CardDescription>
          Upload a lower court case document to analyze its appeal potential
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload 
          onFilesSelected={handleFilesSelected}
          maxFiles={1}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {error && (
          <div className="w-full p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <Button 
          onClick={handleAnalyze} 
          disabled={files.length === 0 || isLoading}
          className="w-full"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Case'}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
