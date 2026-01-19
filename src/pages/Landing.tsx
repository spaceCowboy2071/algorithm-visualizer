import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
    >
      {/* Monitor Container */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
        {/* Monitor Frame (Black Bezel) */}
        <div className="flex-1 bg-black p-8 flex flex-col relative">
          {/* Monitor Screen */}
          <div className="flex-1 flex flex-col">
            {/* Terminal Window */}
            <div className="flex-1 bg-[#0d0d0d] border-2 border-[#1a1a1a] rounded-md shadow-2xl flex flex-col overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="bg-[#1a1a1a] px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-gray-500 text-xs font-mono">terminal@algorithmviz</span>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 flex flex-col p-8 text-[#4af626] font-mono overflow-auto">
                {/* Header Section */}
                <div className="mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(74,246,38,0.5)]">
                    <span className="text-[#4af626]">$ </span>Algorithm Visualizer
                    <span className="inline-block w-2 h-6 bg-[#4af626] ml-1 animate-pulse"></span>
                  </h1>
                  <p className="text-base md:text-lg opacity-80 ml-6">&gt; Learn algorithms through interactive visualizations</p>
                </div>

                {/* Content Area - Navigation Buttons */}
                <div className="flex-1 flex flex-col min-h-0">
                  <nav className="flex flex-col gap-6 mb-auto">
                    {/* Sorting Algorithms */}
                    <Link 
                      to="/sorting"
                      className="group border-l-2 border-transparent hover:border-[#4af626] hover:bg-[rgba(74,246,38,0.05)] transition-all pl-4 py-3"
                    >
                      <div className="text-[#4af626]">
                        <span className="font-bold">$ </span>
                        <span className="text-base md:text-lg">sorting-algorithms</span>
                      </div>
                      <div className="text-gray-600 text-sm ml-6 mt-1">
                        # Visualize Bubble, Quick, and Merge Sort
                      </div>
                    </Link>

                    {/* Searching Algorithms */}
                    <Link 
                      to="/searching"
                      className="group border-l-2 border-transparent hover:border-[#4af626] hover:bg-[rgba(74,246,38,0.05)] transition-all pl-4 py-3"
                    >
                      <div className="text-[#4af626]">
                        <span className="font-bold">$ </span>
                        <span className="text-base md:text-lg">searching-algorithms</span>
                      </div>
                      <div className="text-gray-600 text-sm ml-6 mt-1">
                        # Binary Search and Linear Search visualizations
                      </div>
                    </Link>

                    {/* Blind 75 Challenge */}
                    <Link 
                      to="/blind75"
                      className="group border-l-2 border-transparent hover:border-[#4af626] hover:bg-[rgba(74,246,38,0.05)] transition-all pl-4 py-3"
                    >
                      <div className="text-[#4af626]">
                        <span className="font-bold">$ </span>
                        <span className="text-base md:text-lg">blind75-challenge</span>
                      </div>
                      <div className="text-gray-600 text-sm ml-6 mt-1">
                        # Practice 75 essential coding interview problems
                      </div>
                    </Link>
                  </nav>

                  {/* Taskbar */}
                  <div className="mt-auto pt-6 border-t border-[#2a2a2a] flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-4">
                      <button className="border border-[#2a2a2a] text-gray-600 hover:border-[#4af626] hover:text-[#4af626] hover:bg-[rgba(74,246,38,0.05)] px-4 py-2 rounded transition text-sm">
                        About
                      </button>
                      <button className="border border-[#2a2a2a] text-gray-600 hover:border-[#4af626] hover:text-[#4af626] hover:bg-[rgba(74,246,38,0.05)] px-4 py-2 rounded transition text-sm">
                        Docs
                      </button>
                      <a
                        href="https://github.com/spaceCowboy2071/algorithm-visualizer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[#2a2a2a] text-gray-600 hover:border-[#4af626] hover:text-[#4af626] hover:bg-[rgba(74,246,38,0.05)] px-3 py-2 rounded transition flex items-center"
                        aria-label="GitHub Repository"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 fill-current"
                          aria-hidden="true"
                        >
                          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-gray-600 text-xs">v1.0.0</span>
                      <button className="border border-[#2a2a2a] text-gray-600 hover:border-[#4af626] hover:text-[#4af626] hover:bg-[rgba(74,246,38,0.05)] px-4 py-2 rounded transition text-sm">
                        Sign In
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Power LED - positioned at bottom-right of monitor bezel */}
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-[#4af626] rounded-full shadow-[0_0_8px_rgba(74,246,38,0.8)] animate-pulse"></div>
        </div>
      </div>

      {/* Monitor Stand (Neck) */}
      <div 
        className="h-20 flex justify-center items-start"
        style={{ background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)' }}
      >
        <div 
          className="w-16 h-20 rounded-b shadow-md"
          style={{
            background: 'linear-gradient(180deg, #000000 0%, #2a2a2a 20%, #d4d4d4 60%, #a8a8a8 100%)'
          }}
        ></div>
      </div>
    </div>
  );
}

export default Landing;
