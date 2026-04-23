import { Quicksand, Poppins } from 'next/font/google'
import './globals.css'

const fontQuicksand = Quicksand({ 
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

const fontPoppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata = {
  title: 'FCPS Prep | Advanced MCQ Platform',
  description: 'The definitive platform for FCPS preparation using spaced repetition and AI-driven analytics.',
  openGraph: {
    title: 'FCPS Prep Platform',
    description: 'Master your FCPS exams with our advanced MCQ platform.',
    url: 'https://fcps-prep.com',
    siteName: 'FCPS Prep',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://fcps-prep.com',
  },
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fontQuicksand.variable} ${fontPoppins.variable}`}>
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
