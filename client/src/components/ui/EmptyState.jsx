export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <p className="font-display text-2xl text-cream mb-2">{title}</p>
      {description && <p className="text-muted text-sm max-w-md mx-auto mb-6">{description}</p>}
      {action}
    </div>
  );
}
