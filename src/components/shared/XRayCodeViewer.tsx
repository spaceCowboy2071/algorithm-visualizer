import { useState } from 'react';
import type { CodeLanguage } from '../../types/visualization';

interface XRayCodeViewerProps {
  code: {
    javascript: string;
    python: string;
  };
  currentLine: number | null;
  variables: React.ReactNode;
}

function XRayCodeViewer({ code, currentLine, variables }: XRayCodeViewerProps) {
  const [currentLanguage, setCurrentLanguage] = useState<CodeLanguage>('python');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <h3 className="text-sm font-bold">X-Ray Code Viewer</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentLanguage('javascript')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              currentLanguage === 'javascript'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            JavaScript
          </button>
          <button
            onClick={() => setCurrentLanguage('python')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              currentLanguage === 'python'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Python
          </button>
        </div>
      </div>

      {/* Variables */}
      <div className="bg-gray-900 border-b border-gray-700 px-3 py-2">
        <div className="flex items-start gap-3 text-xs">
          <div className="font-semibold text-gray-300 min-w-fit">Variables:</div>
          <div className="font-mono text-gray-400 flex-1">{variables}</div>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-auto p-3 bg-gray-950 max-h-96">
        <pre className="text-xs font-mono leading-relaxed">
          {code[currentLanguage].split('\n').map((line, index) => {
            const lineNumber = index + 1;
            const isActive = currentLine === lineNumber;

            return (
              <div
                key={index}
                className={`px-2 py-0.5 ${
                  isActive ? 'bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500' : ''
                }`}
              >
                <span className="text-gray-500 select-none mr-3 inline-block w-5 text-right">
                  {lineNumber}
                </span>
                <code className={isActive ? 'text-yellow-400 font-bold' : 'text-gray-300'}>
                  {line}
                </code>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export default XRayCodeViewer;
