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
