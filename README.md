# Moov Events Scan

Scanner de contrôle d'entrée pour [Moov Events](https://github.com/dduho/moov-events) : les
contrôleurs à l'entrée d'un événement scannent le QR code de chaque ticket via la caméra du
téléphone (navigateur, sans installation) pour le valider/consommer.

Mini-app dédiée, séparée du backoffice principal, utilisable au doigt sur le terrain.

**Changelog :** voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique détaillé des versions
(versionnage [SemVer](https://semver.org/lang/fr/)).

## Structure

```
moov-events-scan/
├── backend/                 ← Backend Express autonome (port 3211/3311 prod/test)
│   └── src/
│       ├── index.js         : serveur Express, CORS, routage prod/test
│       ├── routes/
│       │   └── scan.js      : connexion par code d'accès + validation/consommation d'un ticket
│       └── services/
├── src/                      ← Frontend Vue 3 + Vite (scan caméra `html5-qrcode`)
└── package.json
```

## Fonctionnement

1. Connexion par code d'accès événement (généré depuis le backoffice de Moov Events).
2. Scan caméra du QR code d'un ticket.
3. Validation + consommation atomique côté serveur (idempotente : un second scan du même
   ticket indique clairement qu'il a déjà été utilisé, jamais de double comptage).
4. États visuels immédiats : valide (vert), déjà utilisé (orange), invalide (rouge).
