import { fr } from '../../i18n/fr';

const styles = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  completed: 'bg-gold/15 text-gold border-gold/30',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-xs font-medium border ${styles[status] || styles.pending}`}
    >
      {fr.status[status] || status}
    </span>
  );
}
