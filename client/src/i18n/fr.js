/** Chaînes FR — structure prête pour une locale arabe ultérieure. */
export const fr = {
  brand: 'Balha Barber',
  tagline: 'L\'art de la coupe masculine',
  nav: {
    home: 'Accueil',
    services: 'Services',
    booking: 'Réserver',
    track: 'Suivi',
    bookNow: 'Réserver maintenant',
    admin: 'Admin',
  },
  home: {
    headline: 'Précision. Style. Présence.',
    sub: 'Un salon pour hommes où chaque détail compte — de la coupe au soin.',
    aboutTitle: 'Le savoir-faire',
    aboutBody:
      'Balha Barber cultive une approche exigeante du barbering : techniques contemporaines, accueil soigné et finitions impeccables. Que vous veniez pour un fade net ou un soin capillaire, nous prenons le temps de faire les choses bien.',
    popularTitle: 'Services populaires',
    whyTitle: 'Pourquoi nous choisir ?',
    why: [
      {
        title: 'Maîtrise technique',
        text: 'Dégradés, contours et styles classiques exécutés avec rigueur.',
      },
      {
        title: 'Réservation simple',
        text: 'Choisissez votre créneau en ligne, sans attente inutile.',
      },
      {
        title: 'Expérience premium',
        text: 'Ambiance soignée, conseils personnalisés, finition durable.',
      },
    ],
    contactTitle: 'Nous trouver',
    ctaTitle: 'Prêt pour votre prochaine coupe ?',
    ctaBody: 'Réservez en quelques minutes. Confirmation sous contrôle du salon.',
  },
  services: {
    title: 'Services & tarifs',
    subtitle: 'Tarifs de démonstration — modifiables par l\'administrateur.',
    demoBadge: 'Prix démo',
    duration: 'min',
    book: 'Réserver',
    empty: 'Aucun service disponible pour le moment.',
  },
  booking: {
    title: 'Réservation',
    steps: {
      service: 'Service',
      date: 'Date',
      slot: 'Créneau',
      details: 'Coordonnées',
      review: 'Récapitulatif',
    },
    next: 'Continuer',
    back: 'Retour',
    confirm: 'Confirmer la demande',
    successTitle: 'Demande enregistrée',
    successBody:
      'Votre rendez-vous est en attente de validation. Utilisez votre adresse e-mail pour consulter son statut.',
    trackingHint: 'Consultez le statut de votre rendez-vous avec l’adresse e-mail fournie.',
    noSlots: 'Aucun créneau disponible pour cette date.',
  },
  track: {
    title: 'Suivi de rendez-vous',
    subtitle: 'Entrez l’adresse e-mail utilisée lors de la réservation pour consulter vos rendez-vous.',
    submit: 'Consulter',
  },
  status: {
    pending: 'En attente',
    confirmed: 'Confirmé',
    rejected: 'Refusé',
    cancelled: 'Annulé',
    completed: 'Terminé',
  },
  admin: {
    loginTitle: 'Espace administrateur',
    dashboard: 'Tableau de bord',
    appointments: 'Rendez-vous',
    services: 'Services',
    hours: 'Horaires',
    clients: 'Clients',
    logout: 'Déconnexion',
  },
  errors: {
    generic: 'Une erreur est survenue. Réessayez.',
    network: 'Impossible de contacter le serveur.',
  },
};

export default fr;
