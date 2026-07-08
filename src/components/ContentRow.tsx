import React from "react";
import { IPTVItem } from "../types";

interface ContentRowProps {
  title: string;
  items: IPTVItem[];
  onSelect: (item: IPTVItem) => void;
  posterHeight?: string;
  renderPoster?: (item: IPTVItem) => React.ReactNode;
  focusedIndex?: number;
}

export default function ContentRow({
  title,
  items,
  onSelect,
  posterHeight = "h-72",
  renderPoster,
  focusedIndex = -1,
}: ContentRowProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold mt-12 mb-6">
        {title}
      </h2>

      <div className="flex gap-6 overflow-x-auto">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`w-52 shrink-0 cursor-pointer rounded-2xl transition-all ${
  focusedIndex === index
    ? "ring-4 ring-[#0066FF] scale-105"
    : ""
}`}
            onClick={() => {
  console.log("CLICK:", item.name);
  onSelect(item);
}}
          >
            {renderPoster ? (
  renderPoster(item)
) : (
  <img
    src={item.logo}
    alt={item.name}
    className={`w-52 ${posterHeight} object-cover rounded-2xl`}
  />
)}

            <p className="mt-3 text-sm">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}