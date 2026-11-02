---
name: prototype-anime
description: Fabrique un prototype animé d'interface, joué comme un film produit (qualité des films Apple ou Linear) soit dans une maquette de téléphone, soit dans une fenêtre de navigateur pour un parcours desktop, sur un fond gris : parcours enchaîné écran par écran, doigt en verre liquide (mobile) ou curseur qui clique (desktop), contrôles qui foncent sous l'appui, saisies au clavier, transitions natives de la plateforme, caméra qui zoome sur l'action avec un flou de mouvement proportionnel à sa vitesse. React, framer-motion, Next.js. Déclencher dès qu'on demande un prototype animé, une vidéo de parcours, un film d'application ou de produit web, des écrans enchaînés avec taps ou clics, zoom ou motion blur, pour un case study, un portfolio, une démo ou un deck.
---

# Prototype animé, joué comme un film

Le but : qu'un lecteur voie une vraie personne utiliser le produit, sans rien lire. Chaque appui ou chaque clic mène à l'écran suivant, les champs se remplissent, la caméra s'approche de l'endroit où se passe l'action puis recule, et à la fin le parcours s'efface et recommence.

Deux formats, un seul moteur :

| | Téléphone (`device="phone"`, par défaut) | Desktop (`device="desktop"`) |
|---|---|---|
| Cadre | Téléphone sombre avec Dynamic Island | Fenêtre de navigateur avec barre d'adresse (`url`) |
| Espace des coordonnées | 390 × 844 px | 1440 × 900 px, ou `size={{ w, h }}` (1280 × 800, 1920 × 1080…) |
| Qui agit | Un doigt en verre liquide | Un curseur (flèche) qui survole puis clique |
| Saisie | Pavé numérique, clavier, SMS reçu | Frappe au clavier dans le champ, sans pavé |
| Transitions | Poussée, montée, lancement depuis le store, fondu | Fondu, glissement de quelques pixels, panneau qui monte |

Les écrans, les gestes posés dessus, les plans de caméra et la boucle sont les mêmes dans les deux formats.

Le code de référence, éprouvé en production sur un site portfolio, est dans `reference/` :

| Fichier | Rôle |
|---|---|
| `JourneyFilm.tsx` | Le lecteur : horloge, enchaînement des étapes, transitions d'écran, doigt ou curseur, caméra, lecture automatique, contrôles. Propriétés : `steps`, `device`, `size`, `url`, `label`, `labels` |
| `DeviceMockup.tsx` | Le cadre : téléphone ou fenêtre de navigateur, dessiné en CSS (Tailwind) |
| `ScaledScreen.tsx` | L'écran dans son espace de pixels, mis à l'échelle du cadre |
| `FilmClock.ts` | L'horloge partagée (`useFilmTime`, `phase`, `easeOut`) : pause = tout se fige sur la même image |
| `FilmOverlays.tsx` | Les gestes posés sur un écran, communs aux deux formats : `TypeField`, `Selected`, `Reveal`, `CheckboxCheck`, `Countdown`, `Appear` (menu, infobulle, toast, dialogue), `Scroll` (page qui défile). Propres au mobile : `CodeBoxes`, `NumPad`, `SmsBanner`, `StoreScreen`, `SplashScreen`, `VideoCallScreen`. La couleur d'accent est la constante `ACCENT` en tête de fichier |
| `ScanOverlays.tsx` | Pulsation d'un bloc (`PulseOverlay`, commun) ; scan de carte à la caméra (mobile) |
| `PlayerControls.tsx`, `controls.tsx` | Gros bouton lecture centré, petite pause en bas à droite du conteneur gris, `useReducedMotion` |
| `exemple-films.tsx` | Deux films mobiles complets d'une app imaginaire, « Lumen » (démarrage depuis le store, puis réservation d'un créneau) |
| `exemple-films-desktop.tsx` | Un film desktop complet de la version web de Lumen (connexion, tableau de bord, dialogue de création, retour avec la nouvelle ligne) |
| `VideoCamera.tsx`, `VideoPlayer.tsx`, `exemple-videoCameras.ts`, `activity.mjs`, `shots.mjs` | La caméra des vidéos déjà enregistrées, mobile ou desktop : mesure de l'activité, plans, lecture |

Dans les exemples, les images d'écran sont à fournir ; les `.tsx` du dossier supposent les emplacements `src/components/case-study/` (tout sauf `PlayerControls.tsx`) et `src/components/media/` (`PlayerControls.tsx`). Dépendances : Tailwind CSS, framer-motion, `@phosphor-icons/react`.

## Méthode, dans l'ordre

1. **Choisir le format** : téléphone ou desktop. Un produit présent sur les deux se filme en deux films séparés, jamais mélangés dans un même cadre.
2. **Écrire le parcours avant toute image.** Une ligne par écran : ce que voit la personne, ce qu'elle touche ou clique, ce qui lui répond. Garder le chemin principal, aucune branche. Un film dure entre 20 et 45 secondes.
3. **Rassembler les écrans** à la taille de l'espace de coordonnées (390 × 844 ou 1440 × 900, exports Figma ou captures), en WebP. Les moments sans image se dessinent en code : store, lancement, clavier, SMS, appel vidéo, scan (mobile) ; menu déroulant, infobulle, toast, dialogue, page qui défile (desktop).
4. **Relever les coordonnées sur une planche quadrillée**, jamais à l'œil : générer avec `sharp` une planche de contact de chaque écran avec une grille tous les 50 px (100 px en desktop) et ses graduations, puis lire le centre de chaque bouton et de chaque champ. Prélever les couleurs réelles dans l'image plutôt que de les deviner.
5. **Décrire chaque étape en données** (`FilmStep`) dans un fichier `xxxFilms.tsx`, sur le modèle de l'exemple du bon format.
6. **Vérifier image par image** avec Playwright : captures toutes les 300 ms sur un cycle complet, assemblées en planche. Contrôler que le doigt ou le curseur tombe sur le contrôle, que l'écran suivant répond à l'action, que la caméra cadre l'action, que rien n'arrive blanc.

## Le modèle de données

```ts
interface FilmStep {
  src?: string              // image de l'écran (même ratio que l'espace : 390 × 844 ou 1440 × 900)
  screen?: ReactNode        // ou écran dessiné en code
  overlay?: ReactNode       // gestes posés dessus, minutés depuis le début de l'étape
  taps?: FilmTap[]          // { x, y, at, press?: { w, h, r }, hover?: { w, h, r }, hold? }
  camera?: FilmShot[]       // { at, x, y, zoom }, sans plan la caméra montre tout l'appareil
  duration: number          // l'étape finit juste après son dernier geste
  transition?: 'push' | 'up' | 'fade' | 'launch'
}
```

`hover` n'existe que pour le desktop : la teinte légère d'un contrôle survolé, avant le clic. `launch` n'a de sens que sur mobile (en desktop il se comporte comme `fade`).

## Les règles de rythme qui font « vrai »

Communes aux deux formats :

- **L'écran répond à l'action** : `duration = moment du dernier appui ou clic + 0,45 s` (`ANSWER`). Plus long, on attend. Plus court, l'écran change avant que le doigt ou le curseur touche.
- **Le contrôle fonce sous l'appui** (`press` : noir à 13 %) dès le contact et s'éclaircit au relâchement : c'est ce qui rend l'action crédible.
- **Une idée par plan de caméra** : retour à 1 avant le changement d'écran. Le ressort est amorti critique (raideur 85, amortissement 21) : jamais de dépassement. Le flou vient de la vitesse (plafonné à 2,5 px), jamais posé à la main.
- **La boucle** : le dernier écran s'efface, le premier revient en fondu (0,6 s chacun) et ses gestes attendent la fin du fondu.

Sur téléphone :

- **Le doigt arrive avant d'appuyer** : il part 0,5 s avant le tap, suit un léger arc (18 px plus haut au milieu), se pose, appuie 0,2 s (0,1 s pour des touches tapées à la suite), puis se soulève en dérivant (16 px, 44 px). Il repart de là où il a quitté l'écran précédent.
- **La frappe** : 5 caractères par seconde, un tap par touche, chiffres groupés par paires pour un téléphone. Le champ prend son contour de focus avant la première touche, le clavier monte 0,1 s après le tap dans le champ.
- **Caméra** : zoom entre 1,1 et 1,55 sur la zone de l'action.
- **Les transitions suivent la plateforme** : poussée depuis la droite pour avancer (courbe iOS `0.32, 0.72, 0, 1`, 0,5 s, 3 px de flou sur l'écran entrant), montée depuis le bas pour une caméra ou une feuille, qui redescend en se fermant (on sort par où on est entré), lancement depuis le bouton « Ouvrir » du store (échelle 0,12 vers 1 depuis l'origine du bouton), fondu pour un changement de contexte.

Sur desktop :

- **Le curseur arrive avant de cliquer** : il part 0,6 s avant le clic, suit une courbe très légère (10 px), ralentit en arrivant, rétrécit de 14 % pendant le clic (0,12 s) et laisse un anneau fin qui s'étend. Ensuite il dérive de quelques pixels puis s'efface au bout de 0,9 s. Il repart de là où il a quitté l'écran précédent.
- **Le survol précède le clic** : un bouton ou une ligne de menu prend une teinte légère (`hover`, noir à 5 %) pendant que le curseur arrive, puis `press` la fonce. Sans survol, un clic paraît mécanique.
- **La frappe** : 12 caractères par seconde, aucun tap par touche (il n'y a pas de pavé). Le champ prend son contour de focus avant la première lettre ; le clic dans le champ part 0,3 à 0,5 s avant. Les mots de passe se tapent en points.
- **Caméra** : sur 1440 px, le texte d'un écran entier est trop petit à la taille du cadre. Zoom entre 1,3 et 1,7 sur la zone de l'action (un champ, un menu, une ligne), retour à 1 pour montrer le résultat.
- **Les transitions** : un changement de page est un fondu de 0,3 s ; une navigation en avant glisse de 24 px ; un dialogue ou un panneau monte de 28 px et redescend en se fermant. Jamais de poussée sur toute la largeur.
- **Menus et toasts** : un menu qui s'ouvre sous le curseur, une infobulle, un message de confirmation se posent avec `Appear` (montée de 8 px sortant d'un flou de 2 px, 0,22 s).
- **Les pages longues** défilent avec `Scroll` (ease-in-out, 0,9 s pour la distance d'un écran) ; l'en-tête et la barre latérale restent fixes, hors du bloc qui défile.

## Le doigt en verre liquide (mobile)

Ellipse de 58 × 62 px : dégradé radial blanc, `backdrop-filter: blur(5px) saturate(180%)`, liseré clair, ombre qui raccourcit quand le doigt touche la vitre. À l'appui, un ressort sous-amorti (`exp(-7u)·cos(13u)`) l'écrase de 16 % puis le fait rebondir au-delà de sa taille, et deux anneaux de lumière s'étendent depuis le point de contact. Il n'apparaît que pendant ses trajets et un instant après un appui.

## Le curseur (desktop)

Une flèche noire cernée de blanc, dont la pointe est le point (x, y) du clic, avec une ombre légère. Elle n'apparaît que pendant ses trajets et un instant après un clic. Aucun effet de verre : sur un écran de bureau, le curseur le plus sobre est le plus lisible.

## Lecture et contrôles

- Lecture automatique quand 45 % du film est à l'écran, arrêt hors écran ou onglet masqué. Un lecteur qui a mis en pause n'est jamais relancé de force.
- À l'arrêt : gros bouton lecture centré. En lecture : petite pause en bas à droite du conteneur gris. Mêmes contrôles pour toutes les vidéos du site.
- Les images sont préchargées quand le film approche (marge de 600 px) : aucun écran n'arrive blanc.
- Une seule horloge par étape : pause = le doigt ou le curseur, la frappe et les compteurs se figent sur la même image.

## Mouvement réduit : un choix à faire

Dans le code de référence, les films jouent en entier même quand le système demande de réduire les animations (doigt, curseur, caméra, flou, lecture automatique), parce qu'ils sont le contenu de la figure. `useGestureReducedMotion` (FilmClock) coupe le réglage à l'intérieur d'un film et le respecte partout ailleurs. Pour un autre projet, se poser la question ; la version douce possible : appuis en fondu sur place, frappe et fondus entre écrans gardés, caméra au repos, sans flou.

Avant de conclure qu'un film « ne marche pas sur ordinateur », vérifier le réglage « Réduire les animations » (Réglages Système, Accessibilité, Affichage), ou tester dans Playwright avec `reducedMotion: 'no-preference'` puis `'reduce'`.

## Une vidéo déjà enregistrée : la caméra seule

Pour un prototype déjà filmé (capture d'écran d'un Figma, d'une app web, d'un produit desktop), ne pas redessiner de curseur ni de doigt : les enregistrements montrent déjà le leur. Ajouter seulement la caméra, calée sur le temps de la vidéo :

1. `activity.mjs` mesure, toutes les 0,2 s, la boîte des pixels qui changent (Playwright, canvas, 240 px de large).
2. `shots.mjs` en tire les plans : un rapprochement sur chaque rafale d'activité locale (zoom pour que la zone occupe 62 % du cadre, 1,6 au plus, 1,35 pour les recadrages serrés), retour au plan large quand tout l'écran change et avant la boucle.
3. Les plans vont dans `videoCameras.ts` (clé : chemin de la vidéo) ; `VideoPlayer` les lit et joue la vidéo dans `VideoCamera` (ressorts amortis, flou proportionnel à la vitesse, couche qui recadre sans déborder).
4. Exclure les vidéos déjà montées (zooms, doigt incrustés) et les schémas animés.
5. Quand l'interface est petite sur un fond sombre (captures recadrées, beaucoup de noir) : un **cadrage fixe par vidéo** sur l'interface (`content.mjs` mesure ce qui n'est pas le fond, `calm.mjs` en tire le cadrage : bords au 10e et 90e centile sur toute la vidéo), tenu du début à la fin, et **au plus un rapprochement** sur l'action principale (rafale compacte de 1,5 s ou plus), centré entre l'action et le cadrage. Un recadrage à chaque action (`frame.mjs`) fatigue vite.

## Ce qui rate un film, à éviter

- Des coordonnées estimées à l'œil : le doigt ou le curseur appuie à côté du bouton et tout le film paraît faux.
- Un zoom à chaque écran : la caméra ne bouge que là où l'œil doit aller.
- Des transitions décoratives (rotation, rebond d'écran) : le produit doit se comporter comme un produit.
- Un menu d'étapes ou un minuteur affiché : le film se regarde, il ne se pilote pas.
- Rejouer une animation CSS par écran : tout geste lit l'horloge du film, sinon la pause ne fige rien.
- En desktop, un curseur qui se téléporte d'un contrôle à l'autre, ou un clic sans survol préalable.
- En desktop, un écran de 1440 px montré en entier du début à la fin : le texte devient illisible. Le plan large sert à situer, les rapprochements à lire.
