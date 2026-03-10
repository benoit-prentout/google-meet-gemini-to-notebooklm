# Synchro Google Meet Gemini Notes → NotebookLM

[English](README.md) | [Français](README_FR.md)

Consolidez automatiquement toutes les **"Notes par Gemini" de vos réunions Google Meet** dans un seul **Google Doc Maître**. C'est l'outil idéal pour créer une base de connaissances vivante et illimitée pour **NotebookLM**.

---

## 🚀 Pourquoi cet outil ?

NotebookLM est puissant, mais il limite le nombre de sources. En regroupant des mois de réunions (les vôtres et celles de votre équipe) dans un seul document "cerveau", vous permettez à l'IA de faire des connexions sur le long terme sans jamais atteindre les limites de sources.

### ✨ Nouvelles Fonctionnalités (v4+)

* 👥 **Support Équipe** : Récupère les notes des réunions organisées par vos collègues (fichiers "Partagés avec moi", "Drive Partagés" ou contenant "Notes par Gemini").
* 📊 **Tableau Récapitulatif** : Un tableau s'auto-génère en haut de votre document pour lister toutes les réunions synchronisées.
* 🛡️ **Synchro Intelligente** : Fonctionne même sur les fichiers où vous n'avez que des droits de lecture.
* 📦 **Archives Neutres (English)** : Les archives automatiques sont nommées **"Meeting Notes Archive"** pour que NotebookLM comprenne parfaitement qu'il s'agit de sources de données historiques.
* ⚡ **Performance** : Utilise les APIs Google avancées pour traiter 20+ réunions en quelques secondes.

---

## 🏗 Comment ça marche ?

1. **Scan Global** : Le script cherche les variantes de notes Gemini ("Notes de la réunion", "Notes for", "Notes par Gemini") partout sur votre Drive.
2. **Filtrage** : Il ignore ce qui est déjà synchronisé grâce à une base de données interne.
3. **Nettoyage** : Il extrait le texte, retire le superflu (mentions Gemini, formatage Markdown complexe).
4. **Insertion** : Il ajoute les notes en haut du document et met à jour le tableau récapitulatif.
5. **Archivage** : Si le document devient trop lourd, il crée un document **"Meeting Notes Archive"** horodaté et repart à zéro.

---

## 🛠 Guide d'Installation (Débutants)

### 1️⃣ Créer le Document Maître
1. Créez un nouveau **Google Doc** vide (nommez-le par exemple "Maître - Notes de Réunions").
2. Dans ce document, allez dans le menu **Extensions > Apps Script**.

### 2️⃣ Copier le Code
1. Effacez tout ce qui se trouve dans l'éditeur (le `function myFunction() { ... }`).
2. Copiez tout le contenu du fichier `apps-script/Code.gs` de ce dépôt et collez-le dans l'éditeur.
3. Enregistrez (icône disquette) et nommez le projet "Sync NotebookLM".

### 3️⃣ Configurer les Services Google
Le script a besoin d'accéder directement à Drive et Docs.
1. À gauche de l'éditeur Apps Script, cliquez sur le **+** à côté de **Services**.
2. Cherchez **Google Drive API**, sélectionnez-la et cliquez sur **Ajouter**.
3. Cliquez à nouveau sur le **+**, cherchez **Google Docs API**, sélectionnez-la et cliquez sur **Ajouter**.

### 4️⃣ Première exécution et Autorisation
1. Dans la barre d'outils en haut, assurez-vous que `appendMeetNotesToMaster` est sélectionné.
2. Cliquez sur **Exécuter**.
3. Une fenêtre d'autorisation s'ouvre :
   - Cliquez sur **Examiner les autorisations**.
   - Choisissez votre compte Google.
   - Si un message "Google n'a pas validé cette application" apparaît : cliquez sur **Paramètres avancés** puis sur **Accéder à Sync NotebookLM (non sécurisé)**.
   - Cliquez sur **Autoriser**.
4. Revenez sur votre Google Doc : rafraîchissez la page. Un nouveau menu **🚀 NotebookLM** est apparu !

### 5️⃣ Automatisation (Optionnel mais recommandé)
Pour que la synchro se fasse toute seule toutes les 15 minutes :
1. Dans Apps Script, cliquez sur l'icône horloge (**Déclencheurs**) à gauche.
2. Cliquez sur **+ Ajouter un déclencheur**.
3. Choisissez `appendMeetNotesToMaster`.
4. Type de source : **Déclencheur temporel**.
5. Type de minuteur : **Minuteur par minutes**.
6. Intervalle : **Toutes les 15 minutes**.

---

## 📋 Utilisation au quotidien

| Option | Utilité |
|---|---|
| **Synchroniser maintenant** | Force la récupération des dernières réunions immédiatement. |
| **Archiver maintenant** | Si vous voulez vider le doc manuellement et créer une archive. |
| **Réinitialiser l'état** | Utile si vous voulez tout ré-importer depuis le début. |

---

## 🧠 Connexion avec NotebookLM

1. Allez sur [NotebookLM](https://notebooklm.google.com).
2. Créez un nouveau Notebook.
3. Ajoutez votre **Google Doc Maître** comme source.
4. **Important** : À chaque fois que vous utilisez NotebookLM, cliquez sur le bouton **Actualiser** à côté de la source Google Doc pour qu'il prenne en compte les dernières réunions ajoutées par le script.

---

## 📜 Licence
MIT
