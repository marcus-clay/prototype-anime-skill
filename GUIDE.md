# Guide pas à pas

De zéro à un film de parcours joué dans un téléphone. Compter une demi-heure pour installer et obtenir un premier résultat, puis le temps de préparer tes propres écrans.

## Avant de commencer

| Il te faut | Pourquoi |
|---|---|
| Un compte Claude (Pro convient) | Pour téléverser une skill dans claude.ai |
| L'option « exécution de code et création de fichiers » activée | Les skills ne fonctionnent que si elle est active (Réglages, Capacités) |
| Les écrans de ton parcours, en 390 × 844 pixels | Le film se joue sur tes propres écrans |
| Node.js 20 ou plus, et un projet React ou Next.js | Pour **jouer** le film sur ton ordinateur (étape 7) |

Les libellés de claude.ai évoluent : si un menu n'a pas exactement le nom indiqué ici, cherche l'entrée « Skills » dans les réglages.

## Étape 1. Télécharger la skill

1. Ouvre la page [Releases](../../releases/latest) du dépôt.
2. Télécharge `prototype-anime.zip`.
3. **Ne le décompresse pas** : claude.ai attend l'archive telle quelle. Le dossier `prototype-anime/` doit être à la racine du zip, avec `SKILL.md` dedans.

## Étape 2. L'installer dans claude.ai

1. Dans claude.ai, clique sur ton nom en bas à gauche, puis **Réglages**.
2. Ouvre **Capacités**, puis la section **Skills**.
3. Clique sur **Téléverser une skill** et choisis `prototype-anime.zip`.
4. Vérifie que l'interrupteur de `prototype-anime` est activé.

Si tu préfères **Claude Code** : copie le dossier `prototype-anime/` (celui du dépôt, pas le zip) dans `~/.claude/skills/`, puis relance Claude Code.

## Étape 3. Vérifier qu'elle est bien là

Ouvre une nouvelle conversation et écris :

> Quelles skills as-tu à ta disposition ? Décris-moi prototype-anime en deux phrases.

Claude doit la citer et la décrire. Sinon, retourne aux réglages et vérifie l'interrupteur.

## Étape 4. Écrire le parcours avant toute image

C'est l'étape qui compte le plus. Écris **une ligne par écran** : ce que voit la personne, ce qu'elle touche, ce qui lui répond. Garde le chemin principal, sans branche. Un film dure de 20 à 45 secondes.

Exemple :

1. La fiche de l'app dans le store : la personne appuie sur « Installer », puis sur « Ouvrir ».
2. L'écran d'accueil : elle appuie sur « Commencer ».
3. La connexion : elle tape son numéro de téléphone, puis appuie sur « Continuer ».
4. Le code reçu par SMS : elle le saisit, puis valide.
5. L'accueil connecté : le parcours est terminé.

## Étape 5. Préparer les écrans

- Exporte chaque écran en **390 × 844 pixels**, au format **WebP** (depuis Figma : Export, WebP, 1x ou 2x).
- Nomme-les dans l'ordre du parcours : `01-accueil.webp`, `02-connexion.webp`, etc.
- Les moments sans image se dessinent en code, tu n'as rien à préparer : fiche du store, écran de lancement, clavier, SMS reçu, appel vidéo.

## Étape 6. Demander le prototype à Claude

Dans une conversation où la skill est active, dépose tes écrans et colle ton parcours. Modèle de demande :

> Avec la skill prototype-anime, construis un film de ce parcours. Voici les écrans, dans l'ordre, et la description étape par étape : [colle ton parcours]. L'app s'appelle [nom], sa couleur d'accent est [#xxxxxx]. Donne-moi les fichiers de code à copier dans mon projet, et explique-moi où chacun va.

Claude applique la méthode de la skill : il relève les coordonnées de chaque bouton, règle le rythme des appuis, place les plans de caméra, et te rend les fichiers.

## Étape 7. Jouer le film sur ton ordinateur

Claude.ai produit le code, il ne le fait pas tourner. Pour voir le film :

1. Prends un projet **Next.js** (ou React avec Vite). Pour en créer un : `npx create-next-app@latest mon-film`.
2. Installe les dépendances : `npm install framer-motion @phosphor-icons/react`.
3. Copie les fichiers de `reference/` aux endroits que supposent les imports du code : `FilmClock.ts`, `FilmOverlays.tsx`, `ScanOverlays.tsx`, `JourneyFilm.tsx`, `ScaledScreen.tsx` et `controls.tsx` dans `src/components/case-study/` ; `PlayerControls.tsx` dans `src/components/media/`. Mets à côté de ces fichiers les films rendus par Claude (sur le modèle de `exemple-films.tsx`). `VideoPlayer.tsx`, `VideoCamera.tsx` et `exemple-videoCameras.ts` sont des modèles pour la caméra sur vidéos déjà enregistrées : ils s'appuient sur d'autres fichiers du site d'origine, laisse-les de côté pour un premier film et demande à Claude de les adapter plus tard si besoin.
4. Mets tes images dans `public/images/` aux chemins indiqués dans le fichier de films.
5. Le cadre du téléphone (`DeviceMockup`) n'est pas fourni : demande à Claude de t'en écrire un, une bordure d'environ 3,4 % de la largeur suffit.
6. Lance `npm run dev` et ouvre la page qui affiche le film.

Une autre voie, plus simple : travailler avec **Claude Code** dans ce projet. Il copie, installe et lance tout seul.

## Étape 8. Régler

- **Le doigt appuie à côté du bouton.** Les coordonnées sont probablement estimées à l'œil. Demande à Claude de générer une planche de contact quadrillée tous les 50 pixels et de relever le centre de chaque contrôle dessus.
- **La couleur d'accent.** Une seule constante, `ACCENT`, en tête de `FilmOverlays.tsx`. Pense aussi à la même couleur dans le `rgba(...)` de la fonction `Selected`.
- **Le rythme.** Chaque étape doit finir environ 0,45 seconde après son dernier appui. Plus long, on attend. Plus court, l'écran change avant que le doigt touche.
- **La caméra.** Un zoom seulement là où l'œil doit aller, entre 1,1 et 1,55, et un retour à 1 avant le changement d'écran.

## Dépannage

| Symptôme | Piste |
|---|---|
| La skill n'apparaît pas dans claude.ai | Vérifier que l'exécution de code est activée, et que le zip contient bien `prototype-anime/SKILL.md` à la racine |
| Le téléversement échoue | Ré-télécharger le zip depuis Releases, sans l'avoir décompressé ni recompressé |
| Le film reste immobile sur ton ordinateur | Vérifier le réglage « Réduire les animations » du système (Réglages Système, Accessibilité, Affichage) |
| Un écran arrive blanc | L'image n'est pas au chemin attendu : vérifier le nom et le dossier dans `public/` |
| Erreur « module introuvable » sur `@/components/...` | Le projet n'a pas l'alias `@/`, ou les fichiers ne sont pas dans `src/components/case-study/` |
| Les doigts et les zooms sont saccadés | Tester dans un navigateur à jour, avec les onglets lourds fermés |

## Mettre à jour la skill

Quand une nouvelle version est publiée dans Releases : supprime l'ancienne `prototype-anime` dans Réglages, Capacités, Skills, puis téléverse le nouveau zip.
