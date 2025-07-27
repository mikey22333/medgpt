import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - CliniSynth',
  description: 'Complete API documentation for CliniSynth medical research platform.',
}

export default function APIDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      <div className="prose max-w-none">
        <p>API documentation is coming soon.</p>
      </div>
    </div>
  )
}