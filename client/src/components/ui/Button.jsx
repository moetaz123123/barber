export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

  const variants = {
    primary:
      'bg-gold text-ink hover:bg-gold-soft active:scale-[0.98]',
    secondary:
      'border border-gold/50 text-cream hover:border-gold hover:text-gold',
    ghost: 'text-cream/80 hover:text-gold',
    danger: 'bg-red-900/80 text-cream hover:bg-red-800',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
