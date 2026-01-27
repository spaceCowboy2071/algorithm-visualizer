import { useState } from 'react';
import type { ComplexityInfo, InfoTab } from '../../types/visualization';

interface AlgorithmInfoPanelProps {
  algorithm: ComplexityInfo;
}

function AlgorithmInfoPanel({ algorithm }: AlgorithmInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<InfoTab>('complexity');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
      {/* Algorithm Name Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-2 border-b border-gray-700">
        <h3 className="font-bold text-white">{algorithm.name}</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-750">
        {(['complexity', 'how', 'when', 'where', 'why'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 font-semibold capitalize transition text-xs ${
              activeTab === tab
                ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content - Fixed Height */}
      <div className="h-32 overflow-y-auto">
        {activeTab === 'complexity' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-750 border-b border-gray-700">
                <th className="text-left py-2 px-4 text-gray-300 font-semibold text-xs"></th>
                <th className="text-center py-2 px-4 text-gray-300 font-semibold text-xs">Time</th>
                <th className="text-center py-2 px-4 text-gray-300 font-semibold text-xs">Space</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-4 text-gray-400">Best</td>
                <td className="text-center py-2 px-4 font-mono text-green-400">
                  {algorithm.timeComplexity.best}
                </td>
                <td className="text-center py-2 px-4 font-mono text-blue-400">
                  {algorithm.spaceComplexity}
                </td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-4 text-gray-400">Average</td>
                <td className="text-center py-2 px-4 font-mono text-yellow-400">
                  {algorithm.timeComplexity.average}
                </td>
                <td className="text-center py-2 px-4 font-mono text-blue-400">
                  {algorithm.spaceComplexity}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-gray-400">Worst</td>
                <td className="text-center py-2 px-4 font-mono text-red-400">
                  {algorithm.timeComplexity.worst}
                </td>
                <td className="text-center py-2 px-4 font-mono text-blue-400">
                  {algorithm.spaceComplexity}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-gray-300 text-sm leading-relaxed">
            <p>{algorithm.explanations[activeTab]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlgorithmInfoPanel;
