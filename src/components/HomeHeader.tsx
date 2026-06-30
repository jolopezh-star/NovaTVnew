type HomeHeaderProps = {
  title: string;
  subtitle: string;
};

export default function HomeHeader({
  title,
  subtitle,
}: HomeHeaderProps) {
  return (
    <div className="flex flex-col items-center mb-10">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0066FF] mb-6 shadow-[0_0_35px_rgba(0,102,255,.45)]">
        <span className="text-3xl font-black text-white">N</span>
      </div>

      <h1 className="text-5xl font-display font-black text-white tracking-tight">
        {title}
      </h1>

      <p className="mt-3 text-white/50 text-sm">
        {subtitle}
      </p>
    </div>
  );
}