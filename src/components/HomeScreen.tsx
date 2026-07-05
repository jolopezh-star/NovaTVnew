import { IPTVItem } from "../types";
import { storage } from "../utils";
interface HomeScreenProps {
  continueWatching: IPTVItem[];
  onOpenCatalog: () => void;
}

export default function HomeScreen({
  continueWatching,
  onOpenCatalog,
}: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-10">
      <h1 className="text-4xl font-bold mb-10">
        Nova<span className="text-[#0066FF]">TV</span>
      </h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Continuar viendo
      
        </h2>
        

        {continueWatching.length === 0 ? (
  <div className="rounded-xl border border-white/10 bg-[#101010] h-64 flex items-center justify-center text-white/40">
    Aún no hay contenido para continuar.
  </div>
) : (
  <div className="flex gap-6 overflow-x-auto pb-2">
    {continueWatching.map(item => (
      <div
        key={item.id}
        className="w-44 shrink-0"
      >
        <img
          src={item.logo}
          alt={item.name}
          className="w-44 h-64 object-cover rounded-xl"
          referrerPolicy="no-referrer"
        />
        <p className="mt-3 text-sm font-medium line-clamp-2">
          {item.name}
        </p>
      </div>
    ))}
  </div>
)}
<div className="mt-10 flex justify-center">
  <button
    onClick={onOpenCatalog}
    className="px-10 py-4 rounded-2xl bg-[#0066FF] text-white font-bold text-lg"
  >
    Explorar catálogo
  </button>
</div>
      </section>
    </div>
  );
}