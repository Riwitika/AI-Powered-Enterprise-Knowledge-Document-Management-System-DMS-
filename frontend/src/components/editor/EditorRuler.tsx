export default function EditorRuler() {
  const ticks = Array.from({ length: 19 }, (_, i) => i);

  return (
    <div className="w-full max-w-[920px] mx-auto h-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between px-10 text-[9px] font-mono text-slate-400 select-none shrink-0 relative mt-1 rounded-t-sm">
      {/* Left Margin Marker */}
      <div className="absolute left-8 top-0.5 bottom-0.5 flex flex-col items-center justify-center cursor-ew-resize group" title="Left Margin">
        <div className="w-2.5 h-2.5 bg-blue-600 rotate-45 border border-white shadow-2xs group-hover:scale-110 transition-transform" />
      </div>

      {/* Tick Ruler Scale */}
      <div className="flex-1 flex justify-between items-end h-full px-2">
        {ticks.map((num) => (
          <div key={num} className="flex flex-col items-center h-full justify-end relative">
            <div className="w-[1px] h-1.5 bg-slate-300" />
            <span className="text-[8px] leading-none mb-0.5 font-sans font-medium text-slate-400">{num > 0 ? num : ''}</span>
          </div>
        ))}
      </div>

      {/* Right Margin Marker */}
      <div className="absolute right-8 top-0.5 bottom-0.5 flex flex-col items-center justify-center cursor-ew-resize group" title="Right Margin">
        <div className="w-2.5 h-2.5 bg-blue-600 rotate-45 border border-white shadow-2xs group-hover:scale-110 transition-transform" />
      </div>
    </div>
  );
}
