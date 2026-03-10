# Synchro Google Meet Gemini Notes → NotebookLM (Version Modernisée)

[English](README.md) | [Français](README_FR.md)

Automatisez la consolidation des **"Notes by Gemini" de Google Meet** dans un seul **Google Doc Maître**, créant ainsi une source de connaissances durable et structurée pour **NotebookLM**.

---

## 🚀 Présentation

Ce projet fournit un **Google Apps Script** qui scanne en continu votre dossier `Meet Recordings`, extrait le texte des nouvelles notes de réunion générées par Gemini, et les ajoute à **un document maître unique**.

Ce document maître sert de "cerveau cumulatif" pour **NotebookLM**, vous permettant d'analyser et de synthétiser des mois de réunions sans dépasser les limites de sources de NotebookLM.

### ✨ Fonctionnalités Modernisées (V8)
* ✅ **Support du moteur V8** : Utilise le JavaScript moderne (ES6+).
* ✅ **Dédoublonnage Illimité** : Utilise les métadonnées des fichiers (description) au lieu des propriétés de script limitées (pas de limite de 9 Ko).
* ✅ **Scopes Explicites** : Inclut `appsscript.json` for une autorisation simplifiée.
* ✅ **API Drive v3** : Utilise l'API avancée pour des exports de documents fiables.
* ✅ **Auto-archivage** : Gère automatiquement la taille du document maître.
* ✅ **Notifications** : Rapport par e-mail après chaque synchronisation.
* ✅ **Dashboard** : Page web de statut pour suivre l'état du système.

---

## 🏗 Comment ça marche ?

1.  **Déclencheur** : S'exécute via un minuteur (ex: toutes les 15 minutes).
2.  **Scan** : Parcourt le(s) dossier(s) source(s) à la recherche de Google Docs.
3.  **Dédoublonnage** : Vérifie la présence du marqueur `[SYNCED]` dans la description du fichier.
4.  **Export** : Convertit la note Meet en texte brut via l'API Drive.
5.  **Ajout** : Insère le contenu dans le Doc Maître avec titres (H2/H3) et participants.
6.  **Marquage** : Met à jour la description du fichier source pour éviter tout doublon.

---

## 🛠 Instructions d'Installation

### 1️⃣ Créer le Document Maître
* Créez un nouveau Google Doc (ex: "Archives Réunions Master").
* Copiez son **ID** depuis l'URL : `https://docs.google.com/document/d/[ID]/edit`

### 2️⃣ Déployer le Script
1. Allez sur [script.google.com](https://script.google.com).
2. Créez un **Nouveau Projet**.
3. Copiez le contenu de `apps-script/Code.gs` dans l'éditeur (remplacez tout).
4. **Afficher le Manifeste** :
    * Cliquez sur les **Paramètres du projet** (roue crantée ⚙️) à gauche.
    * Cochez : "**Afficher le fichier manifeste « appsscript.json » dans l'éditeur**".
    * Revenez à l'**Éditeur** (< >), cliquez sur `appsscript.json`, et remplacez son contenu par celui de ce dépôt.
5. **Ajouter le Service Drive** :
    * Dans l'**Éditeur**, cliquez sur le **+** à côté de **Services**.
    * Sélectionnez **Google Drive API**.
    * Vérifiez que la version est **v3** et cliquez sur **Ajouter**.

### 3️⃣ Configurer
1. Dans les **Paramètres du projet** (⚙️), descendez jusqu'à **Propriétés de script**.
2. Ajoutez une propriété :
    * **Propriété** : `MASTER_DOC_ID`
    * **Valeur** : Collez l'ID de votre Doc Maître.
3. (Optionnel) Dans `Code.gs`, modifiez `SOURCE_FOLDERS` si vous utilisez plusieurs dossiers.

### 4️⃣ Autoriser & Automatiser
1. **Forcer l'autorisation** :
    * Sélectionnez `appendMeetNotesToMaster` et cliquez sur **Exécuter**.
    * Cliquez sur **Examiner les autorisations** et validez les écrans de sécurité.
2. **Configurer le déclencheur** :
    * Allez dans **Déclencheurs** (icône réveil ⏰).
    * Ajoutez un déclencheur : `appendMeetNotesToMaster` / `Déclencheur temporel` / `Toutes les 15 minutes`.
3. **(Optionnel) Déployer le Dashboard** :
    * Cliquez sur **Déployer** > **Nouveau déploiement** > **Application Web**.
    * Copiez l'URL pour accéder à votre suivi en direct.

---

## ❓ Dépannage

### Le menu "🚀 NotebookLM" n'apparaît pas
Le menu n'apparaît que si le script est **lié au document** (container-bound). Au lieu de créer le script depuis `script.google.com`, ouvrez votre Master Doc et allez dans **Extensions > Apps Script**. Collez le code ici, enregistrez et actualisez la page du document.

### Erreur "Unexpected error" dans les journaux
Google Apps Script échoue parfois à appliquer les styles de titres (H2, H3) sur les documents volumineux. Le script inclut une sécurité qui utilisera du texte en **Gras** à la place si cela se produit. Cela n'arrête pas le processus de synchronisation.

---

## 🧠 Utilisation avec NotebookLM

1. Ouvrez [NotebookLM](https://notebooklm.google.com).
2. Créez un nouveau notebook.
3. Ajoutez votre **Google Doc Maître** comme source.
4. Pour discuter avec vos dernières réunions, cliquez simplement sur **Actualiser** (Refresh) sur la source dans NotebookLM.

---

## 📜 Licence
MIT
