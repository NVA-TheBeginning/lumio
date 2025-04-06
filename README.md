# Lumio

[![CI](https://github.com/NVA-TheBeginning/lumio/actions/workflows/ci.yaml/badge.svg)](https://github.com/NVA-TheBeginning/lumio/actions/workflows/ci.yaml)

# 🎓 Lumio — Gestionnaire de projets étudiants

**Lumio** est une application web et mobile permettant à des enseignants de gérer des projets étudiants, leurs groupes, livrables, soutenances, rapports, évaluations, et bien plus.

## 🏗️ Architecture Microservices

L’application est construite en **architecture microservices** avec une **API Gateway** centrale en NestJS + Fastify.  
Chaque microservice est responsable d’un domaine fonctionnel précis.

---

## 🚪 `API Gateway`
- Centralise toutes les requêtes externes
- Sécurité (JWT, Passport, Guard global, rate limiting)
- Swagger fédéré : doc commune des microservices
- Proxy intelligent vers les microservices


---

## ⚙️ Microservices

### 🔐 `auth-service`
Rôles :

- Authentification et autorisation des utilisateurs.

- Gestion des comptes utilisateurs (enseignants, étudiants).

Fonctions clés :

- Connexion via OAuth 2.0 (Google, Microsoft Azure).
- Gestion des JWT (génération, validation).
- Création sécurisée des comptes utilisateurs (enseignants, étudiants).
- Vérification des droits d’accès (enseignant vs étudiant).
- Réinitialisation de mot de passe (si gestion des comptes en local).
---

### 📁 `project-service`
Rôles :

- Gestion complète des projets étudiants.
- Gestion des promotions.

Fonctions clés :

- Création/modification/suppression de promotions.
- Ajout manuel ou automatique (CSV, JSON) d’élèves dans une promotion.
- Création/modification/suppression des projets (nom, description, statut visible/brouillon).
- Association projet-promotion.
- Déclenchement d'alertes emails lors de la création d’un nouveau projet visible.~~

---

### 👥 `group-service`
Rôles :

- Gestion des groupes d'étudiants associés à un projet précis.

Fonctions clés :

- Définition des règles de constitution des groupes :
    - Manuel (par l'enseignant via interface dédiée).
    - Aléatoire (automatique).
    - Libre (interface étudiante).

- Vérification des règles (nombre min/max par groupe).
- Définition d’une deadline pour constitution des groupes.
- Affectation automatique des étudiants restants après deadline.
- Modification manuelle possible des groupes par l’enseignant.

---

### 📝 `evaluation-service`
Rôles :

- Gestion complète des évaluations par les enseignants.

Fonctions clés :

- Création de grilles de notation (critères pondérés, individuels ou par groupe).
- Organisation des ordres et horaires des soutenances :
  - Génération automatique avec horaires et durée par groupe.
  - Ajustement manuel de l’ordre par l'enseignant.
- Téléchargement de documents PDF (ordre de passage, feuilles d’émargement).
- Saisie directe des notes/commentaires par l’enseignant (via interface web/mobile).
- Calcul automatique de la note finale pondérée pour chaque groupe.
- Validation et publication officielle des notes vers les étudiants.

---

### 📦 `deliverable-service`
Rôles :

- Gestion complète des évaluations par les enseignants.

Fonctions clés :

- Création de grilles de notation (critères pondérés, individuels ou par groupe).
- Organisation des ordres et horaires des soutenances :
    - Génération automatique avec horaires et durée par groupe.
    - Ajustement manuel de l’ordre par l'enseignant.

- Téléchargement de documents PDF (ordre de passage, feuilles d’émargement).
- Saisie directe des notes/commentaires par l’enseignant (via interface web/mobile).
- Calcul automatique de la note finale pondérée pour chaque groupe.
- Validation et publication officielle des notes vers les étudiants.

---

### 📄 `report-service`
Rôles :
- Gestion des rapports rédigés en ligne par les étudiants (Markdown/WYSIWYG).

Fonctions clés :

- Création et organisation des parties d’un rapport.
- Sauvegarde automatique du contenu rédigé par étudiants.
- Visualisation complète ou partielle par l’enseignant.
- Navigation rapide entre les rapports des différents groupes.
- Gestion collaborative (si plusieurs étudiants écrivent en même temps).

---

### 🧪 `plagiarism-service`
Rôles :

- Analyse automatique des livrables soumis pour détecter d'éventuels plagiats.

Fonctions clés :

- Déclenchement automatique à réception des soumissions.
- Analyse par comparaison du contenu (textes, fichiers, structure des dossiers, etc.).
- Calcul d'un indice de similarité précis entre livrables soumis par différents groupes.
- Génération d'un rapport détaillé d’analyse pour l’enseignant.
- Stockage des résultats d'analyse (historique, détails techniques).
- Notification automatique de l’enseignant si suspicion élevée de plagiat.

---

### 🔔 `notification-service`
Rôles :

- Gestion centralisée des notifications email ou externes vers utilisateurs.

Fonctions clés :

- Envoi emails automatiques :
  - Création de compte étudiant.
  - Nouveau projet disponible.
  - Rappels deadlines livrables/groupes.
  - Confirmation réception soumission livrable.
  - Alerte plagiat (enseignant).
  - Notes disponibles.
- Gestion des templates email centralisés.
- Suivi des emails envoyés (logs, monitoring).

---

## 🧪 Technologies utilisées

- **NestJS + Fastify** pour tous les services Node
- **Prisma + PostgreSQL** pour la base de données
- **Swagger** (fédéré) pour la documentation API

---