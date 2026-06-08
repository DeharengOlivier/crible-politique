# Méthodologie

Ce document décrit intégralement le fonctionnement de Political Reality Check.
Un outil politique n'est crédible que si l'on peut vérifier comment il
fonctionne et le contester point par point.

**Position de transparence, dite clairement:** le code source du site n'est pas
public. En revanche, tout ce qui détermine les résultats l'est: les énoncés,
les positions attribuées aux partis avec leurs sources et statuts, les
signatures des courants de pensée, et la formule de calcul. La formule est
volontairement assez simple pour que n'importe qui puisse recalculer un score à
la main et vérifier le nôtre. Toute modification des énoncés, des positions ou
de la formule est consignée, datée et motivée dans un journal public des
modifications (`CHANGELOG-DONNEES.md`). C'est le même modèle de transparence
que les principaux outils d'aide au vote européens (Wahl-O-Mat, Smartvote),
dont le code n'est pas non plus public.

## 1. Principes fondateurs

1. **Un miroir, pas un juge.** L'outil reflète les positions de l'utilisateur,
   il ne les évalue pas. Il ne dit jamais pour qui voter, ne qualifie aucune
   opinion de bonne ou mauvaise, et ne prétend pas connaître les "vrais intérêts"
   de quelqu'un mieux que lui-même.
2. **Déterminisme.** Le calcul est une formule publique: mêmes réponses, même
   résultat. Aucun aléatoire, aucun modèle opaque ne décide d'un profil.
3. **Auto-validation.** Dans tous les modes (y compris l'entretien vocal),
   l'utilisateur valide lui-même chaque position. Aucune interprétation
   automatique d'une réponse libre n'entre dans le calcul.
4. **Pas de donnée inventée.** Quand la position d'un parti n'est pas
   documentée, le parti n'est pas évalué sur cet énoncé. Un "sans opinion" de
   l'utilisateur est exclu du calcul, jamais pénalisé.
5. **Symétrie.** Chaque label, chaque description, chaque énoncé doit pouvoir
   être lu sans gêne par un partisan sincère du courant décrit (test du
   "Turing test idéologique"). Les critiques de biais sont traitées comme des
   bugs: publiquement, source à l'appui.

## 2. Les énoncés

28 énoncés couvrent 7 dimensions: rapport au pouvoir, économie, géopolitique,
société, environnement, rapport à la connaissance, morale politique. La liste
intégrale est visible dans l'application et publiée avec les données.

Règles d'écriture auditables:

- **Une seule proposition par énoncé.** Pas de question double ("X ou Y ?").
- **Vocabulaire neutre.** Aucun mot connoté qui oriente la réponse.
- **Équilibre des polarités.** Être "d'accord" ne correspond pas
  systématiquement au même bord politique d'un énoncé à l'autre.

Échelle de réponse: -2 (pas du tout d'accord), -1, 0 (neutre/partagé), +1,
+2 (tout à fait d'accord), ou "sans opinion".

## 3. La formule de matching partisan

Pour chaque parti:

```
accord(énoncé) = 1 - |position_utilisateur - position_parti| / 4
score(parti)   = moyenne des accords sur les énoncés où
                 (a) l'utilisateur s'est positionné (pas "sans opinion"), et
                 (b) la position du parti est documentée
```

- Le score affiché précise sur combien d'énoncés il est calculé.
- En dessous de 10 énoncés comparables, le score est marqué "couverture faible".
- Le détail complet (énoncé par énoncé, avec les positions des deux côtés et le
  statut de sourçage) est affiché dans le produit, pas seulement le pourcentage.

Exemple de vérification à la main: si vous répondez +2 à un énoncé et que le
parti est codé -1, l'accord vaut 1 - |2 - (-1)| / 4 = 0,25. Le score global est
la moyenne de ces accords. Quiconque relève ses réponses et les positions
affichées peut refaire le calcul.

## 4. Les archétypes et profils synthétiques

Chaque dimension est associée à des "courants de pensée" (archétypes). Chaque
archétype possède une **signature**: le pattern de réponses qu'un partisan type
de ce courant donnerait. Le score d'un archétype est la similarité entre les
réponses de l'utilisateur et cette signature, par la même formule que ci-dessus.
Les signatures sont publiées avec les données; ce sont des hypothèses
éditoriales contestables énoncé par énoncé.

Le **profil synthétique** (la carte partageable) est une combinaison nommée
d'archétypes dominants. Règles d'écriture: même bienveillance pour tous les
profils, chaque profil a une force et un point de vigilance, et son titre doit
pouvoir être revendiqué fièrement par la personne décrite.

Choix délibéré: la carte de partage ne contient jamais les affinités
partisanes, uniquement le profil. Un badge identitaire se partage; une
affiliation partisane s'expose.

## 5. Le positionnement des partis

### Critère d'inclusion des partis (publié)

Sont inclus les partis qui disposent d'au moins un élu au parlement national ou
au Parlement européen. Deux partis sans élus (UPR, Les Patriotes) sont inclus
par exception documentée: leurs propositions institutionnelles singulières
(sortie de l'UE, de l'OTAN) sont analysées dans le Mode 2 et structurent une
partie du débat. **Tout parti non listé peut demander son inclusion** via la
procédure publique; la demande et la réponse sont publiées. La liste couvre la
France et la Belgique (les deux communautés: partis francophones et flamands).

24 partis sont positionnés sur chaque énoncé, chacun avec
un statut:

| Statut | Signification |
|---|---|
| `verifie` | Citation précise, datée et reliée, relue par plusieurs codeurs |
| `a_verifier` | Codage préliminaire d'après programmes et prises de position publiques |
| `non_documente` | Aucune position publique identifiée; le parti n'est pas évalué sur cet énoncé |

**État actuel: l'intégralité du codage est au statut `a_verifier`.** La feuille
de route de fiabilisation est décrite dans `GOVERNANCE.md`:

1. double codage contradictoire par des relecteurs de sensibilités politiques
   différentes, avec publication de la fiabilité inter-codeurs;
2. auto-positionnement proposé officiellement à chaque parti;
3. en cas d'écart entre auto-positionnement et codage, affichage des deux avec
   les justifications.

Contestation: toute position peut être contestée via la procédure publique
(GOVERNANCE.md §3), source à l'appui, avec réponse motivée sous 14 jours.
Chaque correction est consignée dans le journal public des modifications.

## 6. Les analyses de faisabilité (Mode 2)

Les fiches de faisabilité ne rendent jamais de verdict
"faisable / infaisable". Structure imposée:

- **Ce qui est établi**: points de droit peu contestés, avec normes et sources.
- **Ce qui est débattu**: points sur lesquels les juristes divergent réellement.
- **Obstacles**: norme par norme (Constitution, droit de l'UE, traités,
  jurisprudence, budgétaire), chacun sourcé.
- **Voies possibles**: les chemins de mise en œuvre identifiés, y compris ceux
  défendus par les partisans de la mesure.
- **Niveau d'incertitude**: faible / moyenne / élevée.

Statut actuel: fiches préliminaires rédigées par l'équipe, en attente de
validation par des juristes extérieurs nommés (voir `GOVERNANCE.md`). Quand une
fiche est validée, elle porte la mention "Relu par [nom, qualité, date]". Si
deux relecteurs divergent sur un point, le point bascule en "débattu" avec les
deux lectures: le désaccord entre experts est un contenu, pas un échec.

## 7. Place de l'intelligence artificielle

**L'IA n'intervient jamais dans le calcul des résultats d'un utilisateur**:
le scoring est une formule déterministe (§3) et, même en mode vocal, la
position prise en compte est toujours validée à la main par l'utilisateur.

L'IA est utilisée en amont, comme assistante de fabrication des données
(brouillons de codage des positions de partis, brouillons de fiches
juridiques, audits de neutralité, red team), toujours sous validation humaine
et avec statut visible dans le produit tant que la validation n'a pas eu lieu.

Cette partie du projet est intégralement open source: les prompts système
utilisés, la charte d'usage de l'IA (ce qu'elle peut faire, ce qu'elle ne
fera jamais), le pipeline de validation humaine et le registre des usages
réels (modèles, versions, dates) sont publiés dans un dépôt public dédié,
"transparence-ia". Le jeu de données initial (juin 2026) a été produit avec
une assistance IA importante: c'est dit, daté et tracé dans ce registre.

## 8. Confidentialité

Les opinions politiques sont des données sensibles (art. 9 RGPD). Architecture
"privé par construction":

- aucun compte, aucun serveur de données: tout se calcule dans le navigateur;
- la voix (mode entretien) est traitée par les API du navigateur, jamais transmise;
- le lien de comparaison duo encode les réponses dans l'URL elle-même, stocké
  nulle part, partagé uniquement par choix explicite de l'utilisateur;
- aucun pisteur publicitaire, aucune monétisation des données, par principe.

Vérifiable sans accès au code: les outils de développement de n'importe quel
navigateur (onglet "Réseau") permettent de constater qu'aucune requête ne
transmet les réponses pendant le test.

## 9. Limites connues

- 28 énoncés ne couvrent pas tout le champ politique.
- Les positions des partis évoluent; chaque codage référence un programme daté.
- Le score ne pondère pas (encore) l'importance accordée par l'utilisateur à
  chaque sujet.
- Les profils synthétiques sont une simplification assumée, conçue pour la
  discussion, pas pour l'assignation.
- Les signatures d'archétypes reposent sur 4 énoncés par dimension: la
  granularité est limitée et le premier profil synthétique qui correspond est
  retenu (l'ordre de la liste fait partie des données publiées).
