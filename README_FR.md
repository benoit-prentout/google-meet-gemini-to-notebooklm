# Synchro Google Meet Gemini Notes → NotebookLM (Version Modernisée)

[English](README.md) | [Français](README_FR.md)

Automatisez la consolidation des **"Notes by Gemini" de Google Meet** dans un seul **Google Doc Maître**, créant ainsi une source de connaissances durable et structurée pour **NotebookLM**.

---

## 🚀 Présentation

Ce projet fournit un **Google Apps Script** qui scanne en continu votre dossier `Meet Recordings`, extrait le texte des nouvelles notes de réunion générées par Gemini, et les ajoute à **un document maître unique**.

Ce document maître sert de "cerveau cumulatif" pour **NotebookLM**, vous permettant d'analyser et de synthétiser des mois de réunions sans dépasser les limites de sources de NotebookLM.

### ✨ Fonctionnalités Clés
* ✅ **JavaScript Moderne (V8)** : Utilise les dernières normes (ES6+).
* ✅ **Menu Interactif** : Accédez aux outils directement depuis votre Google Doc.
* ✅ **Dédoublonnage Illimité** : Utilise les métadonnées des fichiers (pas de limite de stockage).
* ✅ **Auto-archivage** : Gère automatiquement la taille du document maître.
* ✅ **Notifications** : Rapport par e-mail après chaque synchronisation.

---

## 🏗 Comment ça marche ?

1.  **Déclencheur** : S'exécute via un minuteur (ex: toutes les 15 minutes).
2.  **Scan** : Parcourt le(s) dossier(s) source(s) à la recherche de Google Docs.
3.  **Dédoublonnage** : Vérifie si le fichier porte le marqueur `[SYNCED]`.
4.  **Export** : Convertit la note Meet en texte brut via l'API Drive.
5.  **Ajout** : Insère le contenu dans le Doc Maître avec une structure sémantique.
6.  **Marquage** : Met à jour le fichier source pour éviter les doublons.

---

## 🛠 Instructions d'Installation (Méthode Simple)

### 1️⃣ Préparer le Document Maître
* Créez un nouveau Google Doc (ex: "Master Meeting Notes").
* Ouvrez le document et allez dans **Extensions > Apps Script**.

### 2️⃣ Déployer le Code
1. Copiez le contenu de `apps-script/Code.gs` depuis ce dépôt dans l'éditeur Apps Script (remplacez tout).
2. **Afficher le Manifeste** :
    * Cliquez sur les **Paramètres du projet** (roue crantée ⚙️) à gauche.
    * Cochez : "**Afficher le fichier manifeste « appsscript.json » dans l'éditeur**".
    * Revenez à l'**Éditeur** (< >), cliquez sur `appsscript.json`, et remplacez son contenu par celui de ce dépôt.
3. **Ajouter le Service Drive** :
    * Dans l'**Éditeur**, cliquez sur le **+** à côté de **Services**.
    * Sélectionnez **Google Drive API** (v3) et cliquez sur **Ajouter**.

### 3️⃣ Configurer
1. Dans les **Paramètres du projet** (⚙️), descendez jusqu'à **Propriétés de script**.
2. Ajoutez une propriété :
    * **Propriété** : `MASTER_DOC_ID`
    * **Valeur** : Collez l'ID de votre Google Doc (trouvé dans l'URL).
3. (Optionnel) Dans `Code.gs`, modifiez `SOURCE_FOLDERS` si votre dossier porte un nom différent.

### 4️⃣ Autoriser & Automatiser
1. **Autoriser** :
    * Dans la barre d'outils, sélectionnez `appendMeetNotesToMaster` et cliquez sur **Exécuter**.
    * Suivez les étapes de sécurité Google pour **Autoriser** l'accès.
2. **Rafraîchir** : Rechargez la page de votre Google Doc. Un nouveau menu **🚀 NotebookLM** apparaîtra.
3. **Automatiser** :
    * Dans Apps Script, allez dans **Déclencheurs** (icône réveil ⏰).
    * Ajoutez un déclencheur : `appendMeetNotesToMaster` / `Déclencheur temporel` / `Toutes les 15 minutes`.

---

## ❓ Dépannage

### Le menu "🚀 NotebookLM" n'apparaît pas
Assurez-vous d'avoir bien ouvert Apps Script *depuis* votre document (Etape 1). Enregistrez le code, rafraîchissez la page du document et assurez-vous d'avoir exécuté le script manuellement au moins une fois pour valider les autorisations.

### Erreur "Unexpected error" dans les journaux
Google Apps Script échoue parfois à appliquer les titres (H2, H3) sur les très gros documents. Le script inclut une sécurité qui utilisera du texte en **Gras** à la place.

---

## 🧠 Utilisation avec NotebookLM

1. Ouvrez [NotebookLM](https://notebooklm.google.com).
2. Créez un nouveau notebook et ajoutez votre **Google Doc Maître** comme source.
3. Cliquez simplement sur **Actualiser** dans NotebookLM dès que vous voulez synchroniser vos dernières réunions.

---

## 📜 Licence
MIT
