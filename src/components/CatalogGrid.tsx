import React from "react";
import { IPTVItem } from "../types";

interface CatalogGridProps {
  children: React.ReactNode;
}

export default function CatalogGrid({
  children,
}: CatalogGridProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      {children}
    </div>
  );
}