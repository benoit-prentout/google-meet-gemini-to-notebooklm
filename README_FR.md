# Synchro Google Meet Gemini Notes → NotebookLM

<p align="center">
  <a href="README.md">English</a> | <b>Français</b>
</p>

Consolidez automatiquement toutes les **"Notes par Gemini" de vos réunions Google Meet** dans un seul **Google Doc Maître**. C'est l'outil idéal pour créer une base de connaissances vivante et illimitée pour **NotebookLM**.

---

## 🚀 Installation Rapide (1-Clic)

La méthode la plus simple est de copier le template pré-configuré :

1. **[Cliquer ici pour faire une copie du template](https://docs.google.com/document/d/1rqPvR9OtdjjCLj82k1J0LdiRfSFsk-fQbQPtcX2CXeQ/copy)**
2. Dans votre nouveau document, rafraîchissez la page.
3. Un nouveau menu **🚀 NotebookLM** va apparaître.
4. Lancez **🔄 Sync Now** et suivez les étapes d'autorisation.

---

## 🏗 Pourquoi cet outil ?

NotebookLM est puissant, mais il limite le nombre de sources (50 sources max). En regroupant des mois de réunions (les vôtres et celles de votre équipe) dans un seul document "cerveau", vous permettez à l'IA de faire des connexions sur le long terme sans jamais atteindre les limites.

### ✨ Nouvelles Fonctionnalités (v4.1)

* 👥 **Support Équipe** : Récupère les notes des réunions de vos collègues (fichiers "Partagés avec moi", "Drive Partagés" ou contenant "Notes par Gemini").
* 📊 **Tableau Récapitulatif** : Un tableau généré automatiquement en haut du doc liste toutes les réunions synchronisées.
* 📦 **Auto-Archivage** : Des archives sont créées mensuellement ou dès que le document atteint sa taille limite.
* 📧 **Notifications Mail** : Recevez un mail avec le lien vers votre nouvelle archive dès qu'elle est créée.
* 🛡️ **Synchro Intelligente** : Fonctionne même sur les fichiers où vous n'avez que des droits de lecture.
* ⚡ **Performance** : Utilise les APIs Google avancées pour traiter 20+ réunions en quelques secondes.

---

## 🏗 Comment ça marche ?

1. **Scan Global** : Le script cherche les variantes de notes Gemini ("Notes de la réunion", "Meeting notes", etc.) partout sur votre Drive.
2. **Filtrage** : Il ignore ce qui est déjà synchronisé grâce à une base de données interne.
3. **Nettoyage** : Il extrait le texte, retire le superflu (mentions Gemini, formatage Markdown complexe).
4. **Insertion** : Il ajoute les notes en haut du document et met à jour le tableau récapitulatif.
5. **Archivage** : Mensuellement ou quand il est plein, il crée un document **"Meeting Notes Archive"** et repart à zéro.

---

## 🛠 Guide d'Installation (Manuel)

### 1️⃣ Créer le Document Maître
1. Créez un nouveau **Google Doc** vide (ex: "Maître - Notes de Réunions").
2. Dans ce document, allez dans le menu **Extensions > Apps Script**.

### 2️⃣ Copier le Code
1. Effacez tout ce qui se trouve dans l'éditeur.
2. Copiez tout le contenu du fichier `apps-script/Code.gs` de ce dépôt et collez-le dans l'éditeur.
3. Enregistrez et nommez le projet "Sync NotebookLM".

### 3️⃣ Configurer les Services Google
Le script a besoin d'accéder directement à Drive et Docs.
1. Dans l'éditeur Apps Script, cliquez sur le **+** à côté de **Services**.
2. Cherchez **Google Drive API** (v3) et cliquez sur **Ajouter**.
3. Cliquez à nouveau sur le **+**, cherchez **Google Docs API** (v1) et cliquez sur **Ajouter**.

### 4️⃣ Première exécution et Autorisation
1. Dans la barre d'outils, assurez-vous que `appendMeetNotesToMaster` est sélectionné et cliquez sur **Exécuter**.
2. Suivez les étapes d'**Autorisation** de Google.
3. Revenez sur votre Google Doc : rafraîchissez la page. Un nouveau menu **🚀 NotebookLM** est apparu !

### 5️⃣ Automatisation (Méthode simple)
Pour que la synchro se fasse toute seule toutes les 15 minutes :
1. Dans votre Google Doc, allez dans le menu **🚀 NotebookLM > ⏰ Enable Auto-Sync**.
2. C'est tout ! Le script tournera désormais en tâche de fond.

---

## 📋 Utilisation au quotidien

| Option | Utilité |
|---|---|
| **🔄 Sync Now** | Force la récupération des dernières réunions immédiatement. |
| **⏰ Enable Auto-Sync** | Active la synchronisation automatique toutes les 15 minutes. |
| **📜 View Sync History** | Affiche le log des dernières synchronisations. |
| **📦 Archive Document Now** | Vide le doc manuellement et crée une archive. |
| **🧹 Reset Sync State** | Utile si vous voulez tout ré-importer depuis le début. |
| **❓ Start Here / Help** | Affiche les instructions et conseils rapides. |

---

## 🧠 Connexion avec NotebookLM

1. Allez sur [NotebookLM](https://notebooklm.google.com).
2. Créez un nouveau Notebook.
3. Ajoutez votre **Google Doc Maître** comme source.
4. **Important** : À chaque fois que vous utilisez NotebookLM, cliquez sur le bouton **Actualiser** à côté de la source Google Doc.
5. **Archives** : Quand une archive est créée, n'oubliez pas d'ajouter le fichier archive comme source dans NotebookLM pour conserver tout votre historique !

---

## 📜 Licence
MIT
