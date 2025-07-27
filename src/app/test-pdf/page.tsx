import { PDFExport } from '@/components/ui/PDFExport';

export default function PDFTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">PDF Export Test</h1>
      
      <div id="test-content" className="bg-white border border-gray-200 rounded-lg p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">MG</span>
          </div>
          <div>
            <div className="font-semibold text-sm">CliniSynth</div>
            <div className="text-xs text-gray-500">AI Medical Research Assistant</div>
          </div>
          <div className="ml-auto text-xs text-gray-400">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <h2>Test Medical Response</h2>
          <p>
            This is a test medical response that demonstrates the PDF export functionality. 
            The response includes properly formatted medical content with citations and recommendations.
          </p>
          
          <h3>Key Findings</h3>
          <ul>
            <li>Evidence-based medical information</li>
            <li>Peer-reviewed citations</li>
            <li>Clinical recommendations</li>
            <li>Safety considerations</li>
          </ul>
          
          <h3>Medical Disclaimer</h3>
          <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            ⚠️ <strong>Medical Disclaimer:</strong> This information is for educational purposes only 
            and is not intended as medical advice. Always consult with a qualified healthcare provider 
            for medical decisions.
          </p>
          
          <h3>Sample Citation</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="font-medium text-sm mb-2">
              Sample Medical Study - Effects of Treatment XYZ
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Authors: Smith, J., Johnson, A., Williams, K.
            </div>
            <div className="text-xs text-gray-500">
              Journal of Medical Research • 2024 • DOI: 10.1234/sample.2024.001
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                High Quality Evidence
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <PDFExport 
          contentId="test-content"
          fileName="clinisynth-test-response"
          className="bg-blue-600 text-white hover:bg-blue-700"
        />
      </div>
    </div>
  );
}
