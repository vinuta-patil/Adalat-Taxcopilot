"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  className?: string
  maxFiles?: number
  accept?: Record<string, string[]>
}

export function FileUpload({ 
  onFilesSelected, 
  className,
  maxFiles = 1,
  accept = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  }
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files]
    acceptedFiles.forEach(file => {
      if (newFiles.length < maxFiles) {
        newFiles.push(file)
      }
    })
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }, [files, maxFiles, onFilesSelected])

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles,
    accept
  })

  return (
    <div className={cn("w-full", className)}>
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium">
              {isDragActive ? "Drop the files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse files
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            PDF, DOC, DOCX or TXT (max {maxFiles} {maxFiles === 1 ? "file" : "files"})
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <File className="h-5 w-5 text-muted-foreground" />
                <div className="grid gap-0.5">
                  <p className="text-sm font-medium truncate max-w-[250px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
