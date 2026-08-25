# Moov Events Scan, suivi d'avancement

Voir aussi `servlets/moov-events/TASKS.md` pour le plan complet (cette mini-app est le
"scanner" utilisé par les contrôleurs à l'entrée des événements, elle délègue toute la
logique de validation à `moov-events` via `/internal/scan/validate`).

Port retenu : 3211/3311 (prod/test).

- [x] Backend minimal (proxy `/api/moov-events-scan/validate` -> moov-events)
- [x] Smoke test bout en bout avec moov-events (valid, already_used, invalid_code, invalid,
      wrong_event)
- [ ] Frontend : écran de connexion par code d'accès événement
- [ ] Frontend : scan caméra (html5-qrcode) + états visuels valide/déjà utilisé/invalide
- [ ] Déploiement (après validation explicite de l'utilisateur)
