# Guide pas à pas

De zéro à un film de parcours joué dans un téléphone **ou dans une fenêtre de navigateur** : application mobile, produit web, back-office, tableau de bord. Compter une demi-heure pour installer et obtenir un premier résultat, puis le temps de préparer tes propres écrans.

La skill fonctionne dans **trois outils**. Choisis le tien : le guide indique à chaque étape ce qui change.

## Quel outil choisir

| | Claude.ai | Claude Code | Codex |
|---|---|---|---|
| Où ça se passe | Le site claude.ai | Le terminal, ou l'application de bureau | Le terminal, ou l'extension d'éditeur |
| Installation de la skill | Téléverser un zip | Copier un dossier | Copier un dossier |
| Ce que tu obtiens | Le code du film, à copier toi-même dans un projet | Le film construit, lancé et vérifié dans ton projet | Idem |
| Pour qui | Découvrir sans rien installer | Le plus simple pour **voir le film jouer** | Si tu travailles déjà avec Codex |

Si tu hésites : **Claude.ai** pour essayer, **Claude Code** pour aller jusqu'au film.

## Quel format : mobile ou desktop

| | Mobile | Desktop |
|---|---|---|
| Cadre | Un téléphone | Une fenêtre de navigateur avec barre d'adresse |
| Écrans à fournir | 390 × 844 pixels | 1440 × 900 pixels (ou 1280 × 800, 1920 × 1080 : la taille se règle) |
| Ce qui agit | Un doigt en verre liquide | Un curseur qui survole puis clique |
| Saisie | Pavé numérique, SMS reçu | Frappe au clavier dans le champ |

Un produit présent sur les deux se filme en **deux films séparés**. Le reste de la méthode est identique.

## Avant de commencer

| Il te faut | Pourquoi |
|---|---|
| Un abonnement qui donne accès à l'outil choisi | Claude.ai : un compte Claude. Claude Code : Pro, Max ou supérieur (le plan gratuit n'y donne pas accès). Codex : un compte ChatGPT |
| Les écrans de ton parcours, à la taille du format choisi | Le film se joue sur tes propres écrans (étape 5) |
| Node.js 20 ou plus, et un projet React ou Next.js avec Tailwind CSS | Pour **jouer** le film sur ton ordinateur (étape 7). `create-next-app` propose Tailwind par défaut |

Les libellés des menus évoluent : si un intitulé n'est pas exactement celui indiqué ici, cherche l'entrée « Skills » dans les réglages ou tape `/skills` dans le terminal.

## Étape 1. Installer l'outil (si ce n'est pas déjà fait)

**Claude.ai** : rien à installer, ouvre [claude.ai](https://claude.ai) et connecte-toi.

**Claude Code** : documentation officielle d'installation, [code.claude.com/docs/en/setup](https://code.claude.com/docs/en/setup).

```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# macOS avec Homebrew
brew install --cask claude-code
```

Ouvre ensuite un **nouveau** terminal et vérifie avec `claude --version`. Lance `claude` dans le dossier de ton projet, puis connecte-toi avec ton compte quand le navigateur s'ouvre. Il existe aussi une [application de bureau](https://code.claude.com/docs/en/desktop-quickstart) si tu préfères éviter le terminal.

**Codex** : documentation officielle, [developers.openai.com/codex/cli](https://developers.openai.com/codex/cli).

```bash
# macOS, Linux
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Les commandes pour Windows, npm et Homebrew sont sur la page de la documentation. Lance ensuite `codex` dans le dossier de ton projet et choisis « Sign in with ChatGPT ».

## Étape 2. Installer la skill

### Dans Claude.ai

1. Ouvre la page [Releases](../../releases/latest) du dépôt et télécharge `prototype-anime.zip`.
2. **Ne le décompresse pas** : claude.ai attend l'archive telle quelle. Le dossier `prototype-anime/` doit être à la racine du zip, avec `SKILL.md` dedans.
3. Dans claude.ai, clique sur ton nom en bas à gauche, puis **Réglages**.
4. Ouvre **Capacités**, puis la section **Skills**. Vérifie que l'option « exécution de code et création de fichiers » est activée : les skills en ont besoin.
5. Clique sur **Téléverser une skill** et choisis `prototype-anime.zip`.
6. Vérifie que l'interrupteur de `prototype-anime` est activé.

### Dans Claude Code

La skill est un simple dossier à poser dans `~/.claude/skills/` (tous tes projets) ou dans `.claude/skills/` à la racine d'un projet (ce projet seulement, partageable avec une équipe).

```bash
curl -L -o prototype-anime.zip https://github.com/marcus-clay/prototype-anime-skill/releases/latest/download/prototype-anime.zip
mkdir -p ~/.claude/skills
unzip -o prototype-anime.zip -d ~/.claude/skills
```

Pour une installation limitée à un projet, lance les mêmes commandes depuis la racine du projet en remplaçant `~/.claude/skills` par `.claude/skills`.

Tu peux aussi demander à Claude Code de le faire pour toi :

> Installe la skill du dépôt https://github.com/marcus-clay/prototype-anime-skill : copie son dossier `prototype-anime/` dans `~/.claude/skills/`.

Claude Code surveille ces dossiers : une skill ajoutée dans un dossier `skills` existant est prise en compte sans redémarrage. Si tu as créé le dossier `skills` pendant la session, tape `/reload-skills`.

### Dans Codex

Codex lit ses skills dans `~/.agents/skills/` (tous tes projets) ou `.agents/skills/` à la racine d'un projet.

```bash
curl -L -o prototype-anime.zip https://github.com/marcus-clay/prototype-anime-skill/releases/latest/download/prototype-anime.zip
mkdir -p ~/.agents/skills
unzip -o prototype-anime.zip -d ~/.agents/skills
```

Codex détecte les changements tout seul. Si la skill n'apparaît pas, redémarre Codex. Son installateur de skills intégré (`$skill-installer`) peut aussi, d'après la documentation, aller chercher une skill dans un autre dépôt GitHub : demande-lui d'installer `marcus-clay/prototype-anime-skill`.

## Étape 3. Vérifier qu'elle est bien là

- **Claude.ai** : ouvre une nouvelle conversation et écris « Quelles skills as-tu à ta disposition ? Décris-moi prototype-anime en deux phrases. » Claude doit la citer. Sinon, retourne aux réglages et vérifie l'interrupteur.
- **Claude Code** : tape `/skills` pour lister les skills disponibles, `prototype-anime` doit y figurer. Tu peux la lancer directement avec `/prototype-anime`.
- **Codex** : tape `/skills`, ou `$` pour choisir une skill par son nom.

## Étape 4. Écrire le parcours avant toute image

C'est l'étape qui compte le plus. Choisis d'abord le format (mobile ou desktop), puis écris **une ligne par écran** : ce que voit la personne, ce qu'elle touche ou clique, ce qui lui répond. Garde le chemin principal, sans branche. Un film dure de 20 à 45 secondes.

Exemple mobile :

1. La fiche de l'app dans le store : la personne appuie sur « Installer », puis sur « Ouvrir ».
2. L'écran d'accueil : elle appuie sur « Commencer ».
3. La connexion : elle tape son numéro de téléphone, puis appuie sur « Continuer ».
4. Le code reçu par SMS : elle le saisit, puis valide.
5. L'accueil connecté : le parcours est terminé.

Exemple desktop :

1. La page de connexion : elle tape son e-mail et son mot de passe, puis clique sur « Se connecter ».
2. Le tableau de bord : elle clique sur « Nouvelle séance ».
3. Le dialogue de création : elle tape un intitulé, ouvre le menu des horaires, choisit une heure, clique sur « Créer ».
4. Le tableau de bord de nouveau : la nouvelle ligne apparaît, un message confirme.

## Étape 5. Préparer les écrans

- Exporte chaque écran à la taille de ton format : **390 × 844 pixels** pour un mobile, **1440 × 900 pixels** pour un desktop. Format **WebP** (depuis Figma : Export, WebP, 1x ou 2x).
- Nomme-les dans l'ordre du parcours : `01-accueil.webp`, `02-connexion.webp`, etc.
- Les moments sans image se dessinent en code, tu n'as rien à préparer. Mobile : fiche du store, écran de lancement, clavier, SMS reçu, appel vidéo. Desktop : menu déroulant, infobulle, message de confirmation, page qui défile.

## Étape 6. Demander le prototype

Dans une conversation (ou une session) où la skill est active, dépose tes écrans et colle ton parcours. Modèle de demande :

> Avec la skill prototype-anime, construis un film de ce parcours, en version [mobile | desktop]. Voici les écrans, dans l'ordre, et la description étape par étape : [colle ton parcours]. L'app s'appelle [nom], sa couleur d'accent est [#xxxxxx].

- **Dans Claude.ai**, ajoute : « Donne-moi les fichiers de code à copier dans mon projet, et explique-moi où chacun va. »
- **Dans Claude Code ou Codex**, ajoute : « Intègre-le dans ce projet, lance-le et vérifie le résultat image par image. » L'outil travaille directement dans tes fichiers.

La skill applique sa méthode : relevé des coordonnées de chaque bouton, rythme des appuis ou des clics, plans de caméra.

## Étape 7. Jouer le film sur ton ordinateur

**Avec Claude Code ou Codex**, cette étape est faite pour toi : l'outil installe les dépendances, place les fichiers, lance le serveur et te donne l'adresse à ouvrir. Il te demandera seulement ce qui manque (tes images, par exemple).

**Avec Claude.ai**, qui produit le code sans le faire tourner, voici les étapes à la main :

1. Prends un projet **Next.js avec Tailwind CSS** (ou React avec Vite et Tailwind). Pour en créer un : `npx create-next-app@latest mon-film`.
2. Installe les dépendances : `npm install framer-motion @phosphor-icons/react`.
3. Copie les fichiers de `reference/` aux endroits que supposent les imports du code : `FilmClock.ts`, `FilmOverlays.tsx`, `ScanOverlays.tsx`, `JourneyFilm.tsx`, `ScaledScreen.tsx`, `DeviceMockup.tsx` et `controls.tsx` dans `src/components/case-study/` ; `PlayerControls.tsx` dans `src/components/media/`. Mets à côté de ces fichiers les films rendus par Claude (sur le modèle de `exemple-films.tsx` pour un mobile, `exemple-films-desktop.tsx` pour un desktop). `VideoPlayer.tsx`, `VideoCamera.tsx` et `exemple-videoCameras.ts` sont des modèles pour la caméra sur vidéos déjà enregistrées : ils s'appuient sur d'autres fichiers du site d'origine, laisse-les de côté pour un premier film et demande à Claude de les adapter plus tard si besoin.
4. Mets tes images dans `public/images/` aux chemins indiqués dans le fichier de films.
5. Affiche le film dans une page : `<JourneyFilm steps={…} label="…" labels={{ play: 'Lire', pause: 'Pause' }} />` pour un mobile, avec `device="desktop" url="app.exemple.fr"` en plus pour un desktop.
6. Lance `npm run dev` et ouvre la page.

## Étape 8. Régler

- **Le doigt ou le curseur tombe à côté du bouton.** Les coordonnées sont probablement estimées à l'œil. Demande de générer une planche de contact quadrillée (tous les 50 pixels en mobile, tous les 100 en desktop) et de relever le centre de chaque contrôle dessus.
- **La couleur d'accent.** Une seule constante, `ACCENT`, en tête de `FilmOverlays.tsx`. Pense aussi à la même couleur dans le `rgba(...)` de la fonction `Selected`.
- **Le rythme.** Chaque étape doit finir environ 0,45 seconde après son dernier appui ou clic. Plus long, on attend. Plus court, l'écran change avant que le doigt ou le curseur touche.
- **La caméra.** Un zoom seulement là où l'œil doit aller, et un retour à 1 avant le changement d'écran. Mobile : entre 1,1 et 1,55. Desktop : entre 1,3 et 1,7, car le texte d'un écran de 1440 pixels est trop petit à la taille du cadre.
- **Desktop, un clic qui paraît mécanique.** Ajoute `hover` au clic : le bouton prend une teinte légère pendant que le curseur arrive.

## Dépannage

| Symptôme | Piste |
|---|---|
| La skill n'apparaît pas dans claude.ai | Vérifier que l'exécution de code est activée, et que le zip contient bien `prototype-anime/SKILL.md` à la racine |
| Le téléversement échoue | Ré-télécharger le zip depuis Releases, sans l'avoir décompressé ni recompressé |
| La skill n'apparaît pas dans Claude Code ou Codex | Vérifier que le dossier est bien `…/skills/prototype-anime/SKILL.md` (un seul niveau), puis relancer l'outil ou taper `/reload-skills` dans Claude Code |
| `claude` ou `codex` : commande introuvable | Ouvrir un nouveau terminal après l'installation ; voir la page « Troubleshoot installation » de la documentation de l'outil |
| Le film reste immobile sur ton ordinateur | Vérifier le réglage « Réduire les animations » du système (Réglages Système, Accessibilité, Affichage) |
| Le cadre du téléphone ou de la fenêtre est vide ou déformé | Tailwind CSS n'est pas actif dans le projet, ou ne scanne pas le dossier `src/components/` |
| Un écran arrive blanc | L'image n'est pas au chemin attendu : vérifier le nom et le dossier dans `public/` |
| Erreur « module introuvable » sur `@/components/...` | Le projet n'a pas l'alias `@/`, ou les fichiers ne sont pas dans `src/components/case-study/` |
| Les doigts et les zooms sont saccadés | Tester dans un navigateur à jour, avec les onglets lourds fermés |
| Desktop : le texte est illisible | Ajouter des plans de caméra (zoom 1,3 à 1,7) sur les zones à lire |

## Mettre à jour la skill

Quand une nouvelle version est publiée dans Releases :

- **Claude.ai** : supprime l'ancienne `prototype-anime` dans Réglages, Capacités, Skills, puis téléverse le nouveau zip.
- **Claude Code ou Codex** : relance les commandes de l'étape 2. L'option `-o` d'`unzip` remplace les fichiers existants.
