import React from "react";
import { ChevronRight } from "lucide-react";
import { Category } from "../types";

interface CategoryPanelProps {
  categories: Category[];
  activeArea: string;
  categoryFocusedIndex: number;
  selectedCategory: string;
  fontSize: "normal" | "large" | "extra-large";
  onSelect: (id: string, index: number) => void;
}

function CategoryPanel({
  categories,
  activeArea,
  categoryFocusedIndex,
  selectedCategory,
  fontSize,
  onSelect,
}: CategoryPanelProps) {
  return (
    <div className="w-80 bg-[#0C0C0C]/50 border-r border-white/5 p-5 overflow-y-auto space-y-3 select-none shrink-0 scrollbar-none">

      <p className="text-[11px] text-white/30 font-bold font-mono uppercase tracking-widest pl-3 pb-2 border-b border-white/5">
        Categorías
      </p>

      {categories.map((cat, idx) => {

        const isFocused =
          activeArea === "categories" &&
          categoryFocusedIndex === idx;

        const isActive =
          selectedCategory === cat.id;

        return (

          <button
            key={cat.id}
            onClick={() => onSelect(cat.id, idx)}
            className={`w-full text-left px-4 py-5 rounded-xl font-semibold transition-all duration-150 outline-none flex items-center justify-between border ${
              isFocused
                ? "bg-[#0066FF] text-white border-transparent shadow-[0_0_15px_rgba(0,102,255,0.3)] font-extrabold"
                : isActive
                ? "bg-white/5 text-[#0066FF] border-white/5"
                : "text-white/40 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >

            <span
              className={`truncate font-semibold ${
                fontSize === "large"
                  ? "text-xl"
                  : fontSize === "extra-large"
                  ? "text-2xl"
                  : "text-base"
              }`}
            >
              {cat.name}
            </span>

            <ChevronRight className="w-5 h-5 shrink-0" />

          </button>

        );

      })}

    </div>
  );
}

export default React.memo(CategoryPanel);