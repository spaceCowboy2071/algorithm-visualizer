import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

interface MenuItem {
  label: string;
  desc: string;
  path: string;
}

const DATA_STRUCTURE_ITEMS: MenuItem[] = [
  { label: 'Arrays', desc: 'Bubble, Quick, Merge, Binary', path: '/arrays' },
  { label: 'Linked Lists', desc: 'Insert, Delete, Search, Reverse', path: '/linked-lists' },
  { label: 'Trees', desc: 'BST, Inorder, Preorder, Postorder', path: '/trees' },
  { label: 'Hash Tables', desc: 'Chaining & Linear Probing', path: '/hash-tables' },
  { label: 'Graphs', desc: "BFS, DFS, Dijkstra's, Topo Sort", path: '/graphs' },
];

const CHALLENGE_ITEMS: MenuItem[] = [
  { label: 'Blind 75 Challenge', desc: '75 interview problems', path: '/blind75' },
];

const ALL_ITEMS = [...DATA_STRUCTURE_ITEMS, ...CHALLENGE_ITEMS];

function Landing() {
  const { colors, crtEffects, toggleColorTheme, toggleCrtEffects } = useTheme();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev - 1 + ALL_ITEMS.length) % ALL_ITEMS.length);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % ALL_ITEMS.length);
          break;
        case 'Enter':
          e.preventDefault();
          handleNavigate(ALL_ITEMS[activeIndex].path);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, handleNavigate]);

  // ============================================
  // SHARED: Menu content (used by both layouts)
  // ============================================
  const renderMenuItems = (compact: boolean) => (
    <div className="flex flex-col" style={{ gap: compact ? '2px' : '4px' }}>
      {DATA_STRUCTURE_ITEMS.map((item, i) => (
        <div
          key={item.path}
          className="flex items-center cursor-pointer transition-colors duration-150"
          style={{
            padding: compact ? '8px 10px' : '5px 10px',
            background: activeIndex === i ? colors.bg : 'transparent',
            borderRadius: '2px',
          }}
          onClick={() => handleNavigate(item.path)}
          onMouseEnter={() => setActiveIndex(i)}
        >
          <span
            className="font-bold font-mono text-center"
            style={{
              padding: '0 5px',
              fontSize: compact ? '12px' : '13px',
              marginRight: compact ? '10px' : '12px',
              minWidth: compact ? '23px' : '25px',
              color: activeIndex === i ? colors.cursorText : 'transparent',
              background: activeIndex === i ? colors.cursorBg : 'transparent',
            }}
          >
            &gt;
          </span>
          <span
            className="font-bold font-mono"
            style={{ fontSize: compact ? '13px' : '13px', color: colors.main }}
          >
            {item.label}
          </span>
          <span
            className="font-mono ml-auto"
            style={{ fontSize: compact ? '10px' : '11px', color: colors.main, opacity: 0.45 }}
          >
            {item.desc}
          </span>
        </div>
      ))}

      {/* Divider */}
      <div
        style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: colors.borderFaint, margin: '4px 0' }}
      />

      {CHALLENGE_ITEMS.map((item, origIdx) => {
        const i = DATA_STRUCTURE_ITEMS.length + origIdx;
        return (
          <div
            key={item.path}
            className="flex items-center cursor-pointer transition-colors duration-150"
            style={{
              padding: compact ? '8px 10px' : '5px 10px',
              background: activeIndex === i ? colors.bg : 'transparent',
              borderRadius: '2px',
            }}
            onClick={() => handleNavigate(item.path)}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <span
              className="font-bold font-mono text-center"
              style={{
                padding: '0 5px',
                fontSize: compact ? '12px' : '13px',
                marginRight: compact ? '10px' : '12px',
                minWidth: compact ? '23px' : '25px',
                color: activeIndex === i ? colors.cursorText : 'transparent',
                background: activeIndex === i ? colors.cursorBg : 'transparent',
              }}
            >
              &gt;
            </span>
            <span
              className="font-bold font-mono"
              style={{ fontSize: compact ? '13px' : '13px', color: colors.main }}
            >
              {item.label}
            </span>
            <span
              className="font-mono ml-auto"
              style={{ fontSize: compact ? '10px' : '11px', color: colors.main, opacity: 0.45 }}
            >
              {item.desc}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ============================================
  // SHARED: Bottom action buttons
  // ============================================
  const renderActionButtons = (style: 'desktop' | 'mobile') => {
    const btnClass = style === 'desktop'
      ? 'font-mono text-sm px-4 py-2 rounded cursor-pointer transition-all duration-200'
      : 'font-mono text-[9px] px-[10px] py-[3px] rounded-[3px] cursor-pointer transition-all duration-200';

    const btnStyle = style === 'desktop'
      ? {
          color: colors.main,
          opacity: 0.6,
          border: `1px solid ${colors.borderFaint}`,
          background: 'transparent',
        }
      : {
          color: colors.main,
          opacity: 0.5,
          border: `1px solid ${colors.btnBorder}`,
          background: 'transparent',
        };

    return (
      <>
        <div className="flex gap-2 sm:gap-4 items-center">
          <button className={btnClass} style={btnStyle}>About</button>
          <button className={btnClass} style={btnStyle}>Docs</button>
          <a
            href="https://github.com/spaceCowboy2071/algorithm-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnClass} flex items-center`}
            style={btnStyle}
            aria-label="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          {style === 'desktop' && (
            <span className="font-mono text-xs" style={{ color: colors.main, opacity: 0.3 }}>v1.0.0</span>
          )}
          <button className={btnClass} style={btnStyle}>Sign In</button>
        </div>
      </>
    );
  };

  // ============================================
  // DESKTOP LAYOUT (lg+): CRT Monitor with bezel
  // ============================================
  const renderDesktop = () => (
    <div className="hidden lg:flex flex-col h-screen overflow-hidden">
      {/* Bezel — fills entire viewport */}
      <div
        className="flex-1 flex flex-col relative"
        style={{
          background: 'linear-gradient(170deg, #D4C4A8 0%, #C0B090 40%, #B8A880 100%)',
          padding: '48px 64px 16px',
          border: '1px solid #A89870',
        }}
      >
        {/* Recessed groove line — IBM bezel depth effect */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '10px',
            border: '1.5px solid transparent',
            borderTopColor: 'rgba(255,255,255,0.35)',
            borderLeftColor: 'rgba(255,255,255,0.25)',
            borderBottomColor: 'rgba(0,0,0,0.15)',
            borderRightColor: 'rgba(0,0,0,0.12)',
            borderRadius: '4px',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '12px',
            border: '1px solid transparent',
            borderTopColor: 'rgba(0,0,0,0.1)',
            borderLeftColor: 'rgba(0,0,0,0.08)',
            borderBottomColor: 'rgba(255,255,255,0.3)',
            borderRightColor: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
          }}
        />
        {/* Bezel top: branding */}
        <div className="flex justify-between items-center mb-3 px-1 font-mono">
          <div className="flex items-center">
            <span className="text-[15px] font-bold tracking-widest" style={{ color: '#3A3520' }}>ALGOVIZ</span>
            <span className="text-[11px] ml-2.5 tracking-wide" style={{ color: '#70624A' }}>Educational Terminal</span>
          </div>
          <span className="text-[10px]" style={{ color: '#70624A' }}>Model AV-75</span>
        </div>

        {/* Screen — fills available bezel space */}
        <div
          className="flex-1 relative overflow-hidden flex flex-col"
          style={{
            background: '#1a1e26',
            borderRadius: '10px',
            border: '5px solid #1E1A16',
            padding: '24px 32px',
          }}
        >
          {crtEffects && <div className="crt-scanlines" />}
          {crtEffects && <div className="crt-vignette" />}

          <div className="relative z-[1] font-mono flex-1 flex flex-col">
            {/* BIOS header */}
            <div
              className="text-center mb-4 text-[11px]"
              style={{ color: colors.main, opacity: 0.5 }}
            >
              ── ALGOVIZ System v1.0 &middot; Algorithm Workstation &middot; Mode: STD ──
            </div>

            {/* Menu box — centered, grows to fill */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div
                className="w-full"
                style={{
                  border: `2px solid ${colors.main}`,
                  padding: '18px 24px',
                  maxWidth: '700px',
                }}
              >
                <div
                  className="text-center mb-3 pb-2 text-sm font-bold tracking-wide"
                  style={{ color: colors.main, borderBottom: `1px solid ${colors.border}` }}
                >
                  MAIN MENU
                </div>
                {renderMenuItems(false)}
              </div>
            </div>

            {/* Footer hints */}
            <div
              className="text-center mt-4 text-[11px]"
              style={{ color: colors.main, opacity: 0.4 }}
            >
              Use arrow keys to navigate and ENTER to select
            </div>
            <div
              className="flex justify-between mt-2 px-1 text-[10px]"
              style={{ color: colors.main, opacity: 0.3 }}
            >
              <span>F1 Help&nbsp;&nbsp;&nbsp;F5 About&nbsp;&nbsp;&nbsp;F10 Docs</span>
              <span>ESC Exit&nbsp;&nbsp;&nbsp;&nbsp;v1.0.0</span>
            </div>

            {/* Action buttons row */}
            <div
              className="flex justify-between items-center mt-3 pt-3"
              style={{ borderTop: `1px solid ${colors.borderFaint}` }}
            >
              {renderActionButtons('desktop')}
            </div>
          </div>
        </div>

        {/* Bezel bottom: power LED + controls */}
        <div className="flex justify-between items-center mt-3 px-2 font-mono">
          <div className="flex items-center gap-2">
            <div
              className="w-[9px] h-[9px] rounded-full transition-all duration-300"
              style={{ background: colors.led, boxShadow: colors.ledGlow }}
            />
            <span className="text-[9px] tracking-wide" style={{ color: '#6B5D45' }}>POWER</span>
          </div>
          <div className="flex gap-5 items-center">
            <button
              onClick={toggleColorTheme}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded cursor-pointer transition-colors duration-200 hover:bg-black/5 active:bg-black/10"
            >
              <div className="w-[50px] h-[3px] rounded" style={{ background: '#AE9E80' }} />
              <span className="text-[7px]" style={{ color: '#8A7A60' }}>COLOR</span>
            </button>
            <button
              onClick={toggleCrtEffects}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded cursor-pointer transition-colors duration-200 hover:bg-black/5 active:bg-black/10"
            >
              <div className="w-[50px] h-[3px] rounded" style={{ background: '#AE9E80' }} />
              <span className="text-[7px]" style={{ color: '#8A7A60' }}>CONTRAST</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stand — pinned at bottom of viewport */}
      <div className="flex flex-col items-center" style={{ background: '#111' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, #B8A880, #A89870)',
            height: '24px',
            width: '180px',
            borderRadius: '0 0 6px 6px',
            border: '1px solid #9A8A68',
            borderTop: 'none',
          }}
        />
        <div
          style={{
            background: 'linear-gradient(180deg, #C8B898, #B8A888)',
            height: '8px',
            width: '300px',
            borderRadius: '0 0 10px 10px',
            border: '1px solid #9A8A68',
            borderTop: 'none',
          }}
        />
      </div>
    </div>
  );

  // ============================================
  // MOBILE LAYOUT (<lg): Full screen, no bezel
  // ============================================
  const renderMobile = () => (
    <div
      className="lg:hidden min-h-screen relative overflow-x-hidden font-mono"
      style={{ background: '#1a1e26' }}
    >
      {crtEffects && <div className="crt-scanlines-fixed" />}
      {crtEffects && <div className="crt-vignette-fixed" />}

      <div className="relative z-[1] px-5 pt-12 pb-20 max-w-[400px] mx-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-7 px-0.5">
          <span className="text-sm font-bold tracking-widest" style={{ color: colors.main }}>
            ALGOVIZ
          </span>
          <span className="text-[10px]" style={{ color: colors.main, opacity: 0.35 }}>
            v1.0.0
          </span>
        </div>

        {/* Hero */}
        <div className="text-center mb-6">
          <div
            className="text-[22px] font-bold leading-tight"
            style={{ color: colors.main, letterSpacing: '-0.01em' }}
          >
            Algorithm<br />Visualizer<span className="crt-blink inline-block" style={{ color: colors.main }}>_</span>
          </div>
          <div
            className="text-[11px] mt-2"
            style={{ color: colors.main, opacity: 0.4 }}
          >
            &gt; Learn through interactive visualizations
          </div>
        </div>

        {/* Menu box */}
        <div
          className="mb-5"
          style={{ border: `1.5px solid ${colors.main}`, padding: '12px 14px' }}
        >
          <div
            className="text-center pb-2 mb-2.5 text-xs font-bold tracking-wide"
            style={{ color: colors.main, borderBottom: `1px solid ${colors.border}` }}
          >
            MAIN MENU
          </div>
          {renderMenuItems(true)}
        </div>

        {/* Tap hint */}
        <div
          className="text-center text-[10px] mb-5"
          style={{ color: colors.main, opacity: 0.3 }}
        >
          Tap to select
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          {renderActionButtons('mobile')}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-between items-center px-5 py-3.5 z-[5]"
        style={{ background: 'linear-gradient(transparent, rgba(26,30,38,0.9) 40%)' }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-[7px] h-[7px] rounded-full transition-all duration-300"
            style={{ background: colors.led, boxShadow: colors.ledGlow }}
          />
          <span className="text-[9px]" style={{ color: colors.main, opacity: 0.4 }}>ONLINE</span>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={toggleColorTheme}
            className="font-mono text-[9px] px-2.5 py-[3px] rounded-[3px] cursor-pointer transition-all duration-200"
            style={{ color: colors.main, opacity: 0.5, border: `1px solid ${colors.btnBorder}`, background: 'transparent' }}
          >
            COLOR
          </button>
          <button
            onClick={toggleCrtEffects}
            className="font-mono text-[9px] px-2.5 py-[3px] rounded-[3px] cursor-pointer transition-all duration-200"
            style={{ color: colors.main, opacity: 0.5, border: `1px solid ${colors.btnBorder}`, background: 'transparent' }}
          >
            CONTRAST
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderDesktop()}
      {renderMobile()}
    </>
  );
}

export default Landing;
