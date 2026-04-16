'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, FileText, Download, Target } from "lucide-react"

const resources = [
  {
    title: "SK 19 Clean PDF",
    description: "Medicalstudyzone.com - SK 19 Clean Edition",
    type: "PDF",
    icon: <FileText className="h-8 w-8 text-blue-500" />,
    link: "/resources/SK_19.pdf",
    color: "bg-blue-50 dark:bg-blue-900/20"
  },
  {
    title: "Rafi Golden 14",
    description: "Medicine Feb plus May 22 Edition",
    type: "PDF",
    icon: <BookOpen className="h-8 w-8 text-amber-500" />,
    link: "/resources/Rafi_Golden_14_Medicine.pdf",
    color: "bg-amber-50 dark:bg-amber-900/20"
  },
  {
    title: "SK Pink 4th Edition",
    description: "August 2022 Edition",
    type: "PDF",
    icon: <BookOpen className="h-8 w-8 text-pink-500" />,
    link: "/resources/Sk_Pink_4th_Edition.pdf",
    color: "bg-pink-50 dark:bg-pink-900/20"
  },
  {
    title: "Rafiullah 13th Edition",
    description: "Selected text excerpts and high-yield notes",
    type: "TXT",
    icon: <FileText className="h-8 w-8 text-emerald-500" />,
    link: "/resources/Rafiullah-13th-Edition.txt",
    color: "bg-emerald-50 dark:bg-emerald-900/20"
  },
  {
    title: "Gynae/Obs Syllabus",
    description: "Official FCPS Part 1 Gynae/Obs Syllabus",
    type: "PDF",
    icon: <Target className="h-8 w-8 text-purple-500" />,
    link: "/resources/gynae_obs_syllabus.pdf",
    color: "bg-purple-50 dark:bg-purple-900/20"
  }
]

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Resources</h1>
          <p className="text-muted-foreground mt-2">
            Access high-yield reference materials, books, and syllabi for FCPS Part 1.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource, i) => (
          <Card key={i} className="flex flex-col overflow-hidden border transition-all hover:shadow-md">
            <div className={`p-6 flex justify-center items-center ${resource.color}`}>
              {resource.icon}
            </div>
            <CardHeader className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-1">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </div>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary/50 text-secondary-foreground">
                  {resource.type}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="flex gap-3 mt-4">
                <a 
                  href={resource.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <BookOpen className="mr-2 h-4 w-4" /> View
                </a>
                <a 
                  href={resource.link} 
                  download
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
