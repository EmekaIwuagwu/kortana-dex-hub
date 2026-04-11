export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 border-t-2 border-l-2 border-[#00d4ff] rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-b-2 border-r-2 border-[#8b5cf6] rounded-full animate-spin animate-reverse"></div>
        <div className="font-bold text-white text-xl">K</div>
      </div>
      <p className="mt-6 font-mono text-sm tracking-widest uppercase text-[#00d4ff] animate-pulse">
        Syncing
      </p>
    </div>
  );
}
