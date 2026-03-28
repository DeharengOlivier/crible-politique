# Transparence IA - Political Reality Check

Ce dépôt public documente intégralement la place de l'intelligence artificielle
dans Political Reality Check: où elle intervient, où elle n'intervient jamais,
avec quels prompts, et sous quels garde-fous humains.

Nous publions ce dépôt parce que la bonne question n'est pas "utilisez-vous
l'IA ?" (oui, et quiconque prétend le contraire en 2026 ment probablement),
mais "qu'est-ce que l'IA a le droit de faire chez vous, et qui vérifie ?".
Voici notre réponse complète, vérifiable et critiquable.

## La règle centrale

**L'IA n'intervient jamais dans le calcul de vos résultats.**

Le profil politique d'un utilisateur est calculé par une formule déterministe
publiée (voir la méthodologie sur le site): mêmes réponses, même résultat.
Même dans le mode entretien vocal, la voix n'est jamais interprétée par un
modèle: l'utilisateur valide toujours lui-même sa position sur l'échelle.

L'IA est utilisée en amont, comme **assistante de fabrication des données**,
toujours sous validation humaine:

| Usage | Prompt publié | Garde-fou humain |
|---|---|---|
| Codage préliminaire des positions de partis | [prompts/01](prompts/01-codage-positions-partis.md) | Statut "a_verifier" affiché tant que non relu; double codage contradictoire prévu |
| Rédaction des fiches de faisabilité juridique | [prompts/02](prompts/02-redaction-fiche-faisabilite.md) | Statut "préliminaire" affiché; validation par juristes extérieurs nommés |
| Audit de neutralité des énoncés | [prompts/03](prompts/03-audit-neutralite-enonces.md) | Arbitrage final par relecteurs humains multi-bords |
| Signatures des courants de pensée | [prompts/04](prompts/04-signatures-archetypes.md) | Publiées avec les données, contestables énoncé par énoncé |
| Red team de biais | [prompts/05](prompts/05-red-team-biais.md) | Complète (ne remplace pas) le red team humain |

## Contenu du dépôt

- [CHARTE-IA.md](CHARTE-IA.md): ce que l'IA peut faire, ne peut pas faire, et
  ne fera jamais dans ce projet.
- [PIPELINE.md](PIPELINE.md): le circuit complet d'une donnée, du brouillon IA
  à la publication, avec les points de validation humaine.
- [REGISTRE-USAGES.md](REGISTRE-USAGES.md): journal des usages réels (quel
  modèle, pour quoi, quand), tenu à jour.
- [prompts/](prompts/): les prompts système complets, tels qu'utilisés.

## Honnêteté sur l'état actuel

Le jeu de données initial (juin 2026) a été produit avec une assistance IA
importante, par une équipe réduite. C'est dit, daté et tracé dans
REGISTRE-USAGES.md. Tant qu'une donnée n'a pas passé sa validation humaine
(double codage pour les positions, juristes pour les fiches), elle porte un
statut "préliminaire" visible dans le produit. Nous préférons publier un
statut honnête que simuler une certitude.

## Ce que ce dépôt n'est pas

Le code de l'application n'est pas public (choix assumé et documenté dans la
méthodologie). Ce dépôt couvre tout ce qui concerne l'IA; les données
elles-mêmes (énoncés, positions, sources) sont publiées par ailleurs sous
CC BY 4.0.

## Licence

Contenu publié sous CC BY 4.0. Attribution: "Political Reality Check".

## Contester

Toute critique d'un prompt, d'un garde-fou ou d'un usage peut être déposée en
issue publique sur ce dépôt, ou via la procédure de contestation du projet
(réponse motivée sous 14 jours).
