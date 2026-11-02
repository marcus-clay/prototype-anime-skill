# prototype-anime

Une skill pour Claude qui fabrique des **prototypes animés d'application**, joués comme un petit film : un téléphone sur fond gris, un doigt qui se déplace et appuie, des champs qui se remplissent, des écrans qui se succèdent, une caméra qui zoome sur l'action puis recule.

Elle sert à montrer un parcours sans rien lire : pour un case study, un portfolio, une démo ou un deck.

## Démarrer en trois étapes

1. Télécharger `prototype-anime.zip` dans la page [Releases](../../releases/latest) de ce dépôt, sans le décompresser.
2. Dans Claude (claude.ai), ouvrir **Réglages**, puis **Capacités**, puis **Skills**, et téléverser le fichier. Activer la skill.
3. Dans une nouvelle conversation, demander par exemple : « Fais-moi un prototype animé de ce parcours : accueil, connexion par SMS, réservation d'un créneau. »

Le **[guide pas à pas](GUIDE.md)** détaille chaque étape, de l'installation jusqu'au film joué dans un projet, avec les réglages à connaître et un dépannage.

## Ce que contient la skill

```
prototype-anime/
  SKILL.md        la méthode, les règles de rythme, le modèle de données
  reference/      le code de référence (React, framer-motion)
    JourneyFilm.tsx        le lecteur du film
    FilmClock.ts           l'horloge partagée (la pause fige tout)
    FilmOverlays.tsx       les gestes : frappe, clavier, SMS, cases à cocher...
    ScanOverlays.tsx       scan de carte, pulsation
    exemple-films.tsx      deux films complets d'une app imaginaire
    VideoCamera.tsx, VideoPlayer.tsx, *.mjs   la caméra sur des vidéos déjà enregistrées
```

## À savoir avant de commencer

- **Claude produit le code, il ne le fait pas tourner dans claude.ai.** Pour voir le film jouer, il faut copier les fichiers dans un projet React ou Next.js sur son ordinateur. Le guide explique comment.
- **Les images d'écran sont à fournir** : des exports 390 × 844 pixels, en WebP, de ton propre parcours.
- Si tu utilises **Claude Code**, copie simplement le dossier `prototype-anime/` dans `~/.claude/skills/` : la skill est alors disponible dans tous tes projets.
