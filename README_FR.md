# Synchro Google Meet Gemini Notes → NotebookLM

[English](README.md) | [Français](README_FR.md)

Automatisez la consolidation des **"Notes by Gemini" de Google Meet** dans un seul **Google Doc Maître**, créant une source de connaissances durable pour **NotebookLM**.

---

## 🚀 Présentation

Ce **Google Apps Script** scanne en continu votre dossier `Meet Recordings`, extrait le texte des nouvelles notes de réunion générées par Gemini, et les insère dans un document maître unique.

Ce document maître sert de "cerveau cumulatif" pour **NotebookLM**, vous permettant d'analyser et synthétiser des mois de réunions sans dépasser les limites de sources de NotebookLM.

### ✨ Fonctionnalités Clés

* ✅ **Zéro DocumentApp** — 100% Drive & Docs API pour des performances maximales
* ✅ **Dédoublonnage illimité** — Utilise les métadonnées cachées des fichiers (appProperties)
* ✅ **Détection des mises à jour** — Re-synchronise les notes modifiées après leur premier sync
* ✅ **Archivage automatique** — Archive le doc maître quand il dépasse une taille configurable
* ✅ **Filtre par date** — Ignorer les fichiers plus vieux que N jours (optionnel)
* ✅ **Retry avec backoff** — Gère les erreurs transitoires de l'API Google
* ✅ **Historique des syncs** — Voir les 20 dernières exécutions directement depuis le menu
* ✅ **Notifications email** — Résumé après chaque sync (nouvelles réunions + MàJ + erreurs)
* ✅ **Menu interactif** — Toutes les actions accessibles depuis votre Google Doc

---

## 🏗 Comment ça marche ?

1. **Déclencheur** — S'exécute via un minuteur (ex : toutes les 15 minutes).
2. **Scan** — Interroge le dossier `Meet Recordings` pour les fichiers non encore synchronisés.
3. **Détection MàJ** — Identifie les fichiers déjà synchronisés mais modifiés depuis.
4. **Archivage** — Si le doc maître est trop volumineux, le copie en archive et le réinitialise.
5. **Export** — Convertit chaque note Meet en texte brut via l'API Drive.
6. **Nettoyage** — Supprime les métadonnées Gemini, le formatage Markdown, normalise les espaces.
7. **Insertion groupée** — Envoie toutes les insertions en une seule requête Docs API.
8. **Marquage** — Stocke `synced=true` et `syncedAt=<timestamp>` dans les métadonnées cachées du fichier.
9. **Notification** — Envoie un résumé par email (nouvelles réunions, mises à jour, erreurs).

---

## 🛠 Installation

### 1️⃣ Préparer le Document Maître

* Créez un nouveau Google Doc (ex : "Master Meeting Notes").
* Ouvrez-le et allez dans **Extensions > Apps Script**.

### 2️⃣ Déployer le Code

1. Copiez `apps-script/Code.gs` dans l'éditeur Apps Script (remplacez tout).
2. **Afficher le Manifeste** :
   - Cliquez sur **Paramètres du projet** (icône ⚙️).
   - Cochez "**Afficher le fichier manifeste « appsscript.json » dans l'éditeur**".
   - Ouvrez `appsscript.json` dans l'éditeur et remplacez son contenu par celui du dépôt.

### 3️⃣ Configurer

Modifiez l'objet `CONFIG` en haut de `Code.gs` :

```javascript
const CONFIG = {
  SOURCE_FOLDER_NAME: 'Meet Recordings', // Nom exact de votre dossier Drive
  MAX_FILES_PER_RUN: 20,                 // Fichiers max par exécution
  ENABLE_NOTIFICATIONS: true,            // Résumé email après chaque sync

  ARCHIVE_THRESHOLD_CHARS: 800000,       // Archiver au-delà de ~800K caractères (0 = désactivé)
  ENABLE_UPDATE_DETECTION: true,         // Re-synchroniser les notes modifiées
  MAX_AGE_DAYS: 0,                       // Ignorer les fichiers plus vieux que N jours (0 = pas de filtre)
  MAX_RETRIES: 3,                        // Tentatives en cas d'erreur API transitoire
  HISTORY_SIZE: 20,                      // Nombre de syncs conservés dans l'historique
};
```

### 4️⃣ Autoriser & Automatiser

1. **Autoriser** : Sélectionnez `appendMeetNotesToMaster` dans la barre d'outils et cliquez sur **Exécuter**. Suivez les étapes de sécurité Google.
2. **Rafraîchir** : Rechargez votre Google Doc. Un menu **🚀 NotebookLM** apparaîtra.
3. **Automatiser** : Dans Apps Script, allez dans **Déclencheurs** (icône ⏰) et ajoutez :
   - Fonction : `appendMeetNotesToMaster`
   - Événement : `Déclencheur temporel` → `Minuteur` → `Toutes les 15 minutes`

---

## 📋 Options du Menu

| Option | Description |
|---|---|
| Synchroniser maintenant | Lancer une synchro immédiatement |
| Voir l'historique des syncs | Afficher les 20 dernières exécutions (date, nb fichiers, erreurs, durée) |
| Réinitialiser l'état (Reset) | Effacer l'état de sync — tous les fichiers seront ré-importés |

---

## ❓ Dépannage

**Le menu "🚀 NotebookLM" n'apparaît pas**
Assurez-vous d'avoir ouvert Apps Script *depuis* le document (Extensions > Apps Script). Rafraîchissez la page après avoir sauvegardé le script.

**Erreur "Dossier source introuvable"**
Vérifiez que `CONFIG.SOURCE_FOLDER_NAME` correspond exactement au nom de votre dossier dans Google Drive.

**Les fichiers ne sont pas détectés**
Le script utilise l'API `appProperties` de Drive. Vérifiez que l'API Drive v3 est bien activée dans Services.

---

## 🧠 Utilisation avec NotebookLM

1. Ouvrez [NotebookLM](https://notebooklm.google.com).
2. Créez un notebook et ajoutez votre **Google Doc Maître** comme source.
3. Cliquez sur **Actualiser** dans NotebookLM dès que vous voulez synchroniser vos dernières réunions.

---

## 📜 Licence

MIT
