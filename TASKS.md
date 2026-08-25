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
- [x] Saisie manuelle du code série (8 chiffres) en alternative au scan caméra, nécessaire pour
      valider un ticket acheté par USSD (aucun QR possible sur un écran texte, voir
      `servlets/moov-events/TASKS.md` phase 8) : nouveau bouton "Pas de QR ? Saisir le code" dans
      `ScannerView.vue`, caméra coupée pendant la saisie, `/validate-serial` (backend) proxie vers
      `moov-events/internal/scan/validate-serial`, même compteurs/overlay de résultat que le scan
- [x] Déployé (test + prod) : voir `servlets/moov-events/TASKS.md` section Déploiement pour le
      détail complet (secrets, ports, apps.json, nginx). `/moov-events-scan/` et
      `/moov-events-scan-test/` répondent 200, `/api/moov-events-scan/validate` répond
      correctement.
- [x] **Bug réel** : `scan.js` n'envoyait jamais quel moov-events (test/prod) interroger, la
      validation retombait donc systématiquement sur le backend PROD de moov-events (bases
      Postgres séparées) même scanné depuis l'instance test, d'où des codes d'accès/tickets
      pourtant valides rejetés en "Code d'accès invalide". `env` (déduit du chemin de
      déploiement de ce frontend) transmis à `/validate` et `/validate-serial`.
- [x] Zoom caméra appliqué au démarrage (contrainte MediaTrack standard, best-effort) : évite
      l'ultra grand-angle sur les téléphones à plusieurs objectifs, qui rendait le QR minuscule
      dans le cadre.
- [x] Compteur "Rejetés" qui incrémentait en boucle pour un même QR immobile dans le cadre
      (la caméra redécode en continu) : un code strictement identique au précédent est
      désormais ignoré tant qu'il n'a pas été explicitement rejoué (tap manuel sur le résultat).
      **Corrigé une seconde fois** : le premier correctif bloquait aussi la transition
      valide → déjà_utilisé (un ticket rescanné juste après n'affichait plus rien du tout).
      Chaque scan revalide toujours auprès du serveur (l'état peut avoir changé entre deux
      scans), mais ne recompte que si le résultat diffère du précédent pour ce même code.
- [x] Cadre de scan rendu carré : `qrbox` fixe `{240,240}` dépendait du ratio vidéo réel du
      téléphone (souvent large), recalculé désormais depuis les dimensions réelles du
      viewfinder au démarrage.
- [x] En-tête du scanner affiche le nom de l'événement (`GET /internal/scan/access-code-info`
      côté moov-events) au lieu du seul code d'accès brut.
- [x] Historique persistant des scans par code d'accès (bouton "Historique"), survit à un
      rechargement de page contrairement aux compteurs de session, interroge le journal
      d'activité de moov-events filtré par code (`GET /internal/scan/history`).
