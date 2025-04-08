# 🎓 Lumio — Gestionnaire de projets étudiants

**Lumio** est une application web et mobile permettant aux enseignants de gérer des projets étudiants et leurs étapes clés : création de promotions, constitution de groupes, dépôt de livrables, soutenances, évaluations et détection de plagiat.

## 🤖 CI
[![CI](https://github.com/NVA-TheBeginning/lumio/actions/workflows/ci.yaml/badge.svg)](https://github.com/NVA-TheBeginning/lumio/actions/workflows/ci.yaml)
## 🏗️ Architecture

L’application repose sur une **architecture microservices** avec une API Gateway en NestJS + Fastify.

### 🧱 Composants principaux :
- **API Gateway** : Sécurité, Swagger, redirection vers les microservices.
- **8 microservices** : auth, project, group, deliverable, report, evaluation, plagiarism, notification.
- **Base de données** : PostgreSQL (via Prisma ORM).
- **Frontend** : Next.js
- **Mobile** : Kotlin.

## 🚀 Lancer le projet

```bash
bun upgrade && bun install
bun run prisma
bun run dev
```

## 📚 Documentation complète

Voir [doc.md](docs/doc.md)
