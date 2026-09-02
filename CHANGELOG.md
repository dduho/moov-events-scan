# Changelog — Moov Events Scan

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/), versions
[SemVer](https://semver.org/lang/fr/).

## [1.1.0] - 2026-09-02

### Corrigé
- Rate-limit bloquant (300 req/min) retiré + `trust proxy` corrigé à `2` (au lieu de `1`).
- `dotenv.config()` : ajout de `override:true` pour résister à une variable d'environnement polluée par le démon PM2 lors d'un redéploiement.

## [1.0.0] - 2026-09-02

Version initiale.

[1.1.0]: https://github.com/dduho/moov-events-scan/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/dduho/moov-events-scan/releases/tag/v1.0.0
