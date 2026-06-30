import React from "react";
import { Tv } from "lucide-react";

type HomeHeaderProps = {
  title: React.ReactNode;
  subtitle: string;
};

export default function HomeHeader({
  title,
  subtitle,
}: HomeHeaderProps) {
  return (
    <div className="text-center mb-10">
      <div className="inline-flex h-16 w-16 rounded-3xl bg-[#0066FF] items-center justify-center shadow-[0_0_35px_rgba(0,102,255,.45)] mb-6">
        <Tv className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-5xl font-display font-extrabold tracking-tight text-white">
        {title}
      </h1>

      <p className="mt-3 text-white/50 text-sm font-medium">
        {subtitle}
      </p>
    </div>
  );
}