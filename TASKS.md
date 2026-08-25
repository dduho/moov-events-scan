# Moov Events Scan, suivi d'avancement

Voir aussi `servlets/moov-events/TASKS.md` pour le plan complet (cette mini-app est le
"scanner" utilisé par les contrôleurs à l'entrée des événements, elle délègue toute la
logique de validation à `moov-events` via `/internal/scan/validate`).

Port retenu : 3211/3311 (prod/test).

- [x] Backend minimal (proxy `/api/moov-events-scan/validate` -> moov-events)
- [x] Smoke test bout en bout avec moov-events (valid, already_used, invalid_code, invalid,
      wrong_event)
- [x] Frontend : écran de connexion par code d'accès événement (pas de validation du code tant
      qu'aucun scan n'a été fait, message d'erreur clair au premier scan si le code est invalide)
- [x] Frontend : scan caméra (html5-qrcode) + overlay de résultat animé (valide/déjà
      utilisé/invalide/mauvais événement) + compteurs de session en direct
- [x] Design assorti à moov-events (même palette sombre/néon, cadre de scan animé)
- [x] Build `build`/`build:test` vérifiés sans erreur
- [ ] Test réel sur téléphone (permission caméra, cadrage) : pas encore fait, seulement vérifié
      par build et revue de code
- [ ] Déploiement (après validation explicite de l'utilisateur)
