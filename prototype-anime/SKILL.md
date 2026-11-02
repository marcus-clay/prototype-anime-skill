---
name: prototype-anime
description: Fabrique un prototype animé d'application, joué comme un film produit (qualité des films Apple ou Linear) dans une maquette de téléphone sur un fond gris : parcours enchaîné écran par écran, doigt en verre liquide qui se déplace et appuie (rebond, onde), contrôles qui foncent sous le doigt, saisies au clavier, transitions natives (poussée, montée, lancement depuis le store, fondu de boucle), caméra qui zoome sur l'action avec un flou de mouvement proportionnel à sa vitesse. React, framer-motion, Next.js. Déclencher dès qu'on demande un prototype animé, une vidéo de parcours, un film d'application, des écrans enchaînés avec taps, zoom ou motion blur, pour un case study, un portfolio, une démo ou un deck.
---

# Prototype animé, joué comme un film

Le but : qu'un lecteur voie une vraie personne utiliser l'application, sans rien lire. Chaque appui mène à l'écran suivant, les champs se remplissent, la caméra s'approche de l'endroit où se passe l'action puis recule, et à la fin le parcours s'efface et recommence.

Le code de référence, éprouvé en production sur un site portfolio, est dans `reference/` :

| Fichier | Rôle |
|---|---|
| `JourneyFilm.tsx` | Le lecteur : horloge, enchaînement des étapes, transitions d'écran, doigt, caméra, lecture automatique, contrôles |
| `FilmClock.ts` | L'horloge partagée (`useFilmTime`, `phase`, `easeOut`) : pause = tout se fige sur la même image |
| `FilmOverlays.tsx` | Les gestes posés sur un écran : `TypeField`, `CodeBoxes`, `NumPad`, `SmsBanner`, `CheckboxCheck`, `Countdown`, `Selected`, `Reveal`, et des écrans dessinés en code (`StoreScreen`, `SplashScreen`, `VideoCallScreen`). La couleur d'accent de l'app est la constante `ACCENT` en tête de fichier |
| `ScanOverlays.tsx` | Scan de carte à la caméra, pulsation d'un bloc |
| `ScaledScreen.tsx` | L'écran 390 × 844 mis à l'échelle de la maquette |
| `PlayerControls.tsx`, `controls.tsx` | Gros bouton lecture centré, petite pause en bas à droite du conteneur gris, `useReducedMotion` |
| `exemple-films.tsx` | Deux films complets d'une app imaginaire, « Lumen » (démarrage depuis le store, puis réservation d'un créneau) : le modèle à recopier. Les images d'écran sont à fournir |
| `VideoCamera.tsx`, `VideoPlayer.tsx`, `exemple-videoCameras.ts`, `activity.mjs`, `shots.mjs` | La caméra des vidéos déjà enregistrées : mesure de l'activité, plans, lecture |

Dépendances à adapter dans un autre projet : `DeviceMockup` (cadre du téléphone, bordure de 3,4 % de la largeur), les alias `@/` (les fichiers de référence supposent qu'ils sont copiés dans `src/components/case-study/`), Phosphor pour les icônes, framer-motion pour les ressorts.

## Méthode, dans l'ordre

1. **Écrire le parcours avant toute image.** Une ligne par écran : ce que voit la personne, ce qu'elle touche, ce qui lui répond. Garder le chemin principal, aucune branche. Un film dure entre 20 et 45 secondes.
2. **Rassembler les écrans** en 390 × 844 (exports Figma, captures de l'app), en WebP. Les moments sans image (store, lancement, clavier, SMS, appel vidéo, scan) se dessinent en code : voir `FilmOverlays.tsx`.
3. **Relever les coordonnées sur une planche quadrillée**, jamais à l'œil : générer avec `sharp` une planche de contact de chaque écran avec une grille tous les 50 px et ses graduations, puis lire le centre de chaque bouton et de chaque champ. Prélever les couleurs réelles (couleur du bouton, fond) dans l'image plutôt que de les deviner.
4. **Décrire chaque étape en données** (`FilmStep`) dans un fichier `xxxFilms.tsx`, sur le modèle de l'exemple.
5. **Vérifier image par image** avec Playwright : captures toutes les 300 ms sur un cycle complet, assemblées en planche. Contrôler que le doigt tombe sur le contrôle, que l'écran suivant répond à l'appui, que la caméra cadre l'action, que rien n'arrive blanc.

## Le modèle de données

```ts
interface FilmStep {
  src?: string              // image de l'écran (390 × 844)
  screen?: ReactNode        // ou écran dessiné en code
  overlay?: ReactNode       // gestes posés dessus, minutés depuis le début de l'étape
  taps?: FilmTap[]          // { x, y, at, press?: { w, h, r }, hold? }
  camera?: FilmShot[]       // { at, x, y, zoom }, sans plan la caméra montre tout le téléphone
  duration: number          // l'étape finit juste après son dernier geste
  transition?: 'push' | 'up' | 'fade' | 'launch'
}
```

## Les règles de rythme qui font « vrai »

- **L'écran répond à l'appui** : `duration = moment du dernier tap + 0,45 s` (`ANSWER`). Plus long, on attend. Plus court, l'écran change avant que le doigt touche.
- **Le doigt arrive avant d'appuyer** : il part 0,5 s avant le tap, suit un léger arc (18 px plus haut au milieu), se pose, appuie 0,2 s (0,1 s pour des touches tapées à la suite), puis se soulève en dérivant (16 px, 44 px). Il repart de là où il a quitté l'écran précédent.
- **La frappe** : 5 caractères par seconde, un tap par touche, chiffres groupés par paires pour un téléphone. Le champ prend son contour de focus avant la première touche, le clavier monte 0,1 s après le tap dans le champ.
- **Le contrôle fonce sous le doigt** (`press` : noir à 13 %) dès le contact et s'éclaircit au relâchement : c'est ce qui rend l'appui crédible.
- **Une idée par plan de caméra** : zoom entre 1,1 et 1,55 sur la zone de l'action, retour à 1 avant le changement d'écran. Le ressort est amorti critique (raideur 85, amortissement 21) : jamais de dépassement. Le flou vient de la vitesse (plafonné à 2,5 px), jamais posé à la main.
- **Les transitions suivent la plateforme** : poussée depuis la droite pour avancer (courbe iOS `0.32, 0.72, 0, 1`, 0,5 s, 3 px de flou sur l'écran entrant), montée depuis le bas pour une caméra ou une feuille, qui redescend en se fermant (on sort par où on est entré), lancement depuis le bouton « Ouvrir » du store (échelle 0,12 vers 1 depuis l'origine du bouton), fondu pour un changement de contexte.
- **La boucle** : le dernier écran s'efface, le premier revient en fondu (0,6 s chacun) et ses gestes attendent la fin du fondu.

## Le doigt en verre liquide

Ellipse de 58 × 62 px : dégradé radial blanc, `backdrop-filter: blur(5px) saturate(180%)`, liseré clair, ombre qui raccourcit quand le doigt touche la vitre. À l'appui, un ressort sous-amorti (`exp(-7u)·cos(13u)`) l'écrase de 16 % puis le fait rebondir au-delà de sa taille, et deux anneaux de lumière s'étendent depuis le point de contact. Il n'apparaît que pendant ses trajets et un instant après un appui.

## Lecture et contrôles

- Lecture automatique quand 45 % du film est à l'écran, arrêt hors écran ou onglet masqué. Un lecteur qui a mis en pause n'est jamais relancé de force.
- À l'arrêt : gros bouton lecture centré. En lecture : petite pause en bas à droite du conteneur gris. Mêmes contrôles pour toutes les vidéos du site.
- Les images sont préchargées quand le film approche (marge de 600 px) : aucun écran n'arrive blanc.
- Une seule horloge par étape : pause = le doigt, la frappe et les compteurs se figent sur la même image.

## Mouvement réduit : un choix à faire

Dans le code de référence, les films jouent en entier même quand le système demande de réduire les animations (doigt, caméra, flou, lecture automatique), parce qu'ils sont le contenu de la figure. `useGestureReducedMotion` (FilmClock) coupe le réglage à l'intérieur d'un film et le respecte partout ailleurs. Pour un autre projet, se poser la question ; la version douce possible : appuis en fondu sur place, frappe et fondus entre écrans gardés, caméra au repos, sans flou.

Avant de conclure qu'un film « ne marche pas sur ordinateur », vérifier le réglage « Réduire les animations » (Réglages Système, Accessibilité, Affichage), ou tester dans Playwright avec `reducedMotion: 'no-preference'` puis `'reduce'`.

## Une vidéo déjà enregistrée : la caméra seule

Pour un prototype déjà filmé (capture d'écran d'un Figma, d'une app web), ne pas redessiner de curseur ni de doigt : les enregistrements montrent déjà le leur. Ajouter seulement la caméra, calée sur le temps de la vidéo :

1. `activity.mjs` mesure, toutes les 0,2 s, la boîte des pixels qui changent (Playwright, canvas, 240 px de large).
2. `shots.mjs` en tire les plans : un rapprochement sur chaque rafale d'activité locale (zoom pour que la zone occupe 62 % du cadre, 1,6 au plus, 1,35 pour les recadrages serrés), retour au plan large quand tout l'écran change et avant la boucle.
3. Les plans vont dans `videoCameras.ts` (clé : chemin de la vidéo) ; `VideoPlayer` les lit et joue la vidéo dans `VideoCamera` (ressorts amortis, flou proportionnel à la vitesse, couche qui recadre sans déborder).
4. Exclure les vidéos déjà montées (zooms, doigt incrustés) et les schémas animés.
5. Quand l'interface est petite sur un fond sombre (captures recadrées, beaucoup de noir) : un **cadrage fixe par vidéo** sur l'interface (`content.mjs` mesure ce qui n'est pas le fond, `calm.mjs` en tire le cadrage : bords au 10e et 90e centile sur toute la vidéo), tenu du début à la fin, et **au plus un rapprochement** sur l'action principale (rafale compacte de 1,5 s ou plus), centré entre l'action et le cadrage. Un recadrage à chaque action (`frame.mjs`) fatigue vite.

## Ce qui rate un film, à éviter

- Des coordonnées estimées à l'œil : le doigt appuie à côté du bouton et tout le film paraît faux.
- Un zoom à chaque écran : la caméra ne bouge que là où l'œil doit aller.
- Des transitions décoratives (rotation, rebond d'écran) : l'application doit se comporter comme une application.
- Un menu d'étapes ou un minuteur affiché : le film se regarde, il ne se pilote pas.
- Rejouer une animation CSS par écran : tout geste lit l'horloge du film, sinon la pause ne fige rien.
