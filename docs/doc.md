
# 📚 Documentation technique — Lumio

Description complète des microservices et des responsabilités.

---

## 🧭 Sommaire

- [🚪 API Gateway](#-api-gateway)
- [🔐 auth-service](#-auth-service)
- [📁 project-service](#-project-service)
- [👥 group-service](#-group-service)
- [📦 deliverable-service](#-deliverable-service)
- [📄 report-service](#-report-service)
- [📝 evaluation-service](#-evaluation-service)
- [🧪 plagiarism-service](#-plagiarism-service)
- [🔔 notification-service](#-notification-service)
- [🧪 Technologies utilisées](#-technologies-utilisées)

---

## 🚪 API Gateway

- Centralise toutes les requêtes externes
- Sécurité (JWT, Passport, Guard global, rate limiting)
- Swagger fédéré : doc commune des microservices
- Proxy intelligent vers les microservices

---

## 🔐 auth-service
**Rôles :**
- Authentification et autorisation des utilisateurs.
- Gestion des comptes utilisateurs (enseignants, étudiants).

**Fonctions clés :**
- Connexion via OAuth 2.0 (Google, Microsoft Azure).
- Gestion des JWT (génération, validation).
- Création sécurisée des comptes utilisateurs.
- Vérification des droits d’accès.
- Réinitialisation de mot de passe (si gestion en local).

---

## 📁 project-service
**Rôles :**
- Gestion des projets étudiants et des promotions.

**Fonctions clés :**
- Création/suppression de promotions.
- Ajout d’élèves (manuel ou CSV/JSON).
- Création/modification de projets (nom, statut, description).
- Association projets-promotions.
- Notifications emails à publication.

---

## 👥 group-service
**Rôles :**
- Gestion de la composition des groupes étudiants.

**Fonctions clés :**
- Règles de constitution (manuel, libre, aléatoire).
- Deadline de création.
- Vérification min/max.
- Réaffectation automatique post-deadline.
- Modification manuelle.

---

## 📦 deliverable-service
**Rôles :**
- Gestion des livrables liés aux projets.

**Fonctions clés :**
- Définition de livrables, formats attendus.
- Upload de fichiers / dépôt Git.
- Validation automatique (taille, structure...).
- Gestion du retard avec pénalité.

---

## 📄 report-service
**Rôles :**
- Rédaction des rapports en ligne par les étudiants.

**Fonctions clés :**
- Éditeur Markdown/WYSIWYG.
- Sauvegarde automatique.
- Navigation par groupe.
- Écriture collaborative possible.

---

## 📝 evaluation-service
**Rôles :**
- Notation des livrables, rapports, soutenances.

**Fonctions clés :**
- Création de grilles pondérées.
- Ordre de passage des soutenances.
- Export PDF.
- Saisie des notes en ligne.
- Calcul automatique des moyennes.

---

## 🧪 plagiarism-service
**Rôles :**
- Détection de plagiat entre livrables.

**Fonctions clés :**
- Déclenchement à la soumission.
- Analyse texte, structure, fichiers.
- Rapport de similarité.
- Alerte en cas de taux élevé.
- Historique des détections.

---

## 🔔 notification-service
**Rôles :**
- Envoi des emails liés au projet.

**Fonctions clés :**
- Création de compte, publication projet, rappels, confirmation dépôt.
- Notification de plagiat ou de notes publiées.
- Templates emails.
- Logs des envois.

---

## 🧪 Technologies utilisées

- NestJS + Fastify
- Prisma + PostgreSQL
- Swagger fédéré
- Next.js (frontend)
- Kotlin (mobile)
- GitHub Actions + Docker

