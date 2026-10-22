# Balha Barber — Réservation Barber Shop

Application web complète de réservation pour un salon de coiffure masculin :

- **client/** — React + Vite + Tailwind CSS + Lucide
- **server/** — API REST Express (Node.js)
- **supabase/** — schéma PostgreSQL, RLS et données de démonstration

Les prix affichés sont des **valeurs de démonstration**, modifiables depuis l’administration.

> Supabase, les comptes admin et le déploiement ne sont **pas** préconfigurés. Suivez les étapes ci-dessous.

---

## Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com) (gratuit possible)
- npm

---

## 1. Cloner / ouvrir le projet

```bash
cd barber-booking
```

---

## 2. Configurer Supabase

1. Créez un projet sur [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Ouvrez **SQL Editor** et exécutez dans l’ordre :
   - `supabase/schema.sql`
   - `supabase/rls.sql`
   - `supabase/seed.sql`
3. Dans **Project Settings → API**, notez :
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY` (frontend uniquement)
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (**serveur uniquement**, jamais dans React)

### Créer le compte administrateur

1. **Authentication → Users → Add user** : créez un utilisateur (e-mail + mot de passe).
2. Dans **SQL Editor**, promotez-le :

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Propriétaire'
WHERE id = '<UUID_DE_L_UTILISATEUR>';
```

L’UUID se trouve dans Authentication → Users.

Le rôle admin est **toujours** vérifié côté serveur via la table `profiles`, jamais uniquement depuis le frontend.

---

## 3. Variables d’environnement

### Backend

```bash
cd server
copy .env.example .env
```

Éditez `server/.env` :

| Variable | Description |
|----------|-------------|
| `PORT` | Port API (défaut `3001`) |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Clé anon (optionnelle côté serveur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé **service_role** (secret) |
| `CLIENT_ORIGIN` | Origine CORS du frontend (`http://localhost:5173`) |
| `BUSINESS_TIMEZONE` | Fuseau métier (ex. `Africa/Casablanca`) |

### Frontend

```bash
cd client
copy .env.example .env
```

Éditez `client/.env` :

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | `http://localhost:3001` (ou vide si proxy Vite) |
| `VITE_SUPABASE_URL` | URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé **anon** uniquement |

---

## 4. Installation des dépendances

```bash
cd server
npm install

cd ../client
npm install
```

---

## 5. Lancer en local

Terminal 1 — API :

```bash
cd server
npm run dev
```

→ http://localhost:3001 — santé : http://localhost:3001/api/health

Terminal 2 — React :

```bash
cd client
npm run dev
```

→ http://localhost:5173

- Site public : `/`, `/services`, `/reservation`, `/suivi`
- Admin : `/admin/login` puis `/admin`

---

## 6. Fonctionnalités clés

### Public

- Accueil, services, réservation multi-étapes
- Créneaux calculés selon horaires, pauses, congés et RDV existants
- Double vérification de disponibilité à la confirmation + contrainte d’exclusion PostgreSQL (anti double-booking)
- Suivi sécurisé : `id` + `tracking_token` (pas d’exposition des données des autres clients)

### Admin (`/admin`)

- Dashboard (RDV du jour, en attente, confirmés, terminés, revenus **estimés**)
- Gestion des rendez-vous (confirmer, refuser, annuler, terminer, recherche)
- CRUD services (historique préservé : désactivation si déjà utilisé)
- Horaires, pauses, blocages, durée des créneaux, délais min/max
- Liste clients + historique

---

## 7. Tests

```bash
cd server
npm test
```

Couverture minimale :

- Validation des payloads (rendez-vous, disponibilité, statuts)
- Chevauchement d’horaires
- Refus d’accès aux routes admin sans authentification
- Route `GET /api/health`

Les tests d’intégration complets (création RDV réelle, conflit de créneau) nécessitent Supabase configuré et des données seed.

---

## 8. Déploiement (aperçu)

### Backend (ex. Render, Railway, Fly.io)

1. Racine de build : `server`
2. Commande : `npm install && npm start`
3. Variables : les mêmes que `server/.env`
4. `CLIENT_ORIGIN` = URL HTTPS du frontend

### Frontend (ex. Vercel, Netlify)

1. Racine : `client`
2. Build : `npm run build`
3. Publish : `dist`
4. Variables `VITE_*` au moment du build
5. `VITE_API_URL` = URL publique de l’API

### Supabase

- Déjà hébergé ; pas besoin de déployer la base séparément.
- Vérifiez que RLS est actif après exécution de `rls.sql`.

---

## 9. Structure

```
barber-booking/
├── client/                 # React (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── i18n/fr.js      # Prêt pour une locale arabe
│       └── lib/
├── server/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── validators/
├── supabase/
│   ├── schema.sql
│   ├── rls.sql
│   └── seed.sql
└── README.md
```

---

## 10. Sécurité (rappel)

- Ne jamais mettre `service_role` dans le client React
- CORS limité à `CLIENT_ORIGIN`
- Rate limiting sur création et suivi de rendez-vous
- Prix, durée, statut et rôle recalculés / vérifiés côté serveur
- Mots de passe gérés uniquement par Supabase Auth
