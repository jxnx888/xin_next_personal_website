interface PageBannerProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
}

export default function PageBanner({ title, subtitle, imageSrc }: PageBannerProps) {
  return (
    <div
      className="relative h-52 phone:h-36 overflow-hidden"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Background image */}
      {imageSrc && (
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${imageSrc})`, opacity: 0.25 }}
        />
      )}

      {/* Gradient fade to page bg */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, var(--bg) 100%)' }}
      />

      {/* Tech grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <h1
            className="text-4xl phone:text-2xl font-bold tracking-widest uppercase"
            style={{ color: 'var(--text)', textShadow: '0 0 20px var(--accent-glow)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">{subtitle}</p>
          )}
          <div
            className="mx-auto mt-3 h-px w-20"
            style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
          />
        </div>
      </div>
    </div>
  );
}
