import React from "react";
import { IPTVItem } from "../types";

interface SearchScreenProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: IPTVItem[];
  focusedIndex: number;
}

export default function SearchScreen({
  query,
  onQueryChange,
  results,
  focusedIndex,
}: SearchScreenProps) {
  return (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8">

      <input
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar..."
        className="w-full rounded-xl bg-[#111] border border-white/10 px-5 py-4 text-xl outline-none"
      />

      <div className="mt-4 text-white/50">
        Resultados: {results.length}
      </div>

      <div className="mt-6 flex flex-col gap-2 overflow-y-auto">

        {results.map((item, index) => (

          <div
            key={item.id}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${
              focusedIndex === index
                ? "bg-[#0066FF] ring-2 ring-white"
                : "bg-[#111]"
            }`}
          >

            <img
              src={item.logo}
              className="w-12 h-16 rounded object-cover"
            />

            <div>

              <div className="font-bold">
                {item.name}
              </div>

              <div className="text-sm text-white/50">
                {item.genre} {item.year}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}