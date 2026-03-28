# Charte d'usage de l'IA

Cette charte est opposable: tout écart constaté entre ce document et la
pratique réelle du projet est une faute, traitée comme telle (correction
publique, entrée au registre, réponse motivée).

## 1. Ce que l'IA ne fait jamais (interdictions absolues)

1. **Calculer ou influencer le résultat d'un utilisateur.** Les scores de
   proximité, archétypes et profils sont produits par une formule déterministe
   publiée. Aucun appel à un modèle n'a lieu pendant l'utilisation de l'outil.
2. **Interpréter une réponse libre d'un utilisateur.** En mode vocal, la
   parole sert à réfléchir; seule la position validée à la main par
   l'utilisateur entre dans le calcul.
3. **Publier sans validation humaine.** Aucune donnée produite par IA n'est
   présentée comme vérifiée tant qu'un humain identifiable ne l'a pas relue;
   le statut ("préliminaire" / "à vérifier" / "vérifié") est affiché dans le
   produit.
4. **Traiter des données d'utilisateurs.** L'outil ne collecte aucune donnée;
   il n'y a donc rien à envoyer à un modèle, et cela restera vrai.
5. **Générer des contenus de persuasion politique.** L'IA du projet rédige des
   analyses contraintes par des règles de neutralité; jamais d'argumentaires,
   de slogans ou de contenus de campagne, pour personne.

## 2. Ce que l'IA fait (usages autorisés, sous garde-fous)

1. **Brouillons de codage** des positions de partis, à partir des programmes
   publics, avec source citée pour chaque position et statut "a_verifier"
   obligatoire en sortie.
2. **Brouillons de fiches juridiques**, dans une structure imposée qui
   sépare "établi" et "débattu" et interdit les verdicts.
3. **Audits de neutralité**: détection de formulations orientées, de labels
   non revendicables, d'asymétries de traitement.
4. **Red team**: génération de critiques adverses depuis chaque sensibilité
   politique, pour trouver les biais avant les adversaires.
5. **Tâches d'ingénierie** sans contenu éditorial (code, tests, refactoring).

## 3. Règles transversales

- **Traçabilité**: chaque usage substantiel est consigné dans
  REGISTRE-USAGES.md (modèle, version, tâche, date).
- **Prompts publics**: les prompts système des usages éditoriaux sont publiés
  dans ce dépôt, dans la version réellement utilisée. Modifier un prompt =
  nouvelle entrée au registre.
- **Pluralité des modèles**: pour les audits de neutralité et le red team,
  utiliser au moins deux modèles de fournisseurs différents quand c'est
  possible, pour limiter les biais propres à un modèle unique.
- **L'humain signe**: la responsabilité éditoriale d'une donnée publiée
  revient toujours à une personne ou une instance nommée (équipe, relecteurs,
  comité), jamais "à l'IA".

## 4. Pourquoi ce choix

Un outil d'aide à la réflexion politique fabriqué en partie avec l'IA n'est
pas un problème en soi; un outil qui le cacherait en serait un. La confiance
ne se demande pas, elle se rend vérifiable: prompts publics, statuts visibles,
registre tenu, contestation ouverte.
