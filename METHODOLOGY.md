# Méthodologie

Ce document décrit intégralement le fonctionnement du Crible Politique.
Un outil politique n'est crédible que si l'on peut vérifier comment il
fonctionne et le contester point par point.

**Position de transparence, dite clairement:** tout est public. Le code sous
licence MIT, et tout ce qui détermine les résultats sous licence CC BY 4.0:
les énoncés, les positions attribuées aux partis avec leurs sources et
statuts, les signatures des courants de pensée, et la formule de calcul. La
formule est volontairement assez simple pour que n'importe qui puisse
recalculer un score à la main et vérifier le nôtre, sans avoir à lire le code.
Toute modification des énoncés, des positions ou de la formule est consignée,
datée et motivée dans un journal public des modifications
(`CHANGELOG-DONNEES.md`). Les principaux outils d'aide au vote européens
(Wahl-O-Mat, Smartvote) publient leur méthodologie sans publier leur code;
ici, les deux le sont.

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

Le corpus compte 30 énoncés communs aux deux pays et 3 propres à chacun, soit
33 énoncés par répondant, couvrant 7 dimensions: rapport au pouvoir, économie,
géopolitique, société, environnement, rapport à la connaissance, morale
politique. Chaque dimension porte 4 énoncés communs, sauf la géopolitique qui
en porte 7. La liste intégrale est visible dans l'application et publiée avec
les données.

Le déséquilibre géopolitique est un choix mesuré, pas un accident. Hors
immigration, les quatre énoncés d'origine (UE, OTAN, immigration, intervention)
séparaient le RN de LFI de 2 points sur 12 possibles: les deux partis votent
pareil sur la souveraineté et l'OTAN, et les clivages qui les opposent
réellement (l'Ukraine, la Russie, le Proche-Orient) étaient absents du corpus.
Trois énoncés ont été ajoutés (soutien militaire à l'Ukraine, normalisation
avec la Russie, alignement sur Israël), codés pour les 24 partis à partir de
votes et de déclarations 2024-2026, tous au statut `a_verifier`.

Ce que la mesure dit de ces trois énoncés, dit honnêtement: l'énoncé
israélo-palestinien apporte un axe réellement nouveau (corrélation de 0,08 avec
le clivage Est-Ouest sur les positions des 24 partis) et sépare fortement les
partis dans les deux pays (écart-type 1,40 en France, 1,16 en Belgique). Les
énoncés Ukraine et Russie sont, eux, fortement corrélés à l'axe OTAN existant
(0,84 à 0,95 en valeur absolue): ils ajoutent du poids à ce clivage plus qu'un
axe indépendant, et ce poids supplémentaire est assumé parce que ce débat
structure le champ politique actuel. En Belgique, où le consensus sur l'Ukraine
est large, ils séparent peu (écart-type 0,95 et 0,75); en France ils séparent
beaucoup (1,70 et 1,41). Puisque la proximité est une moyenne sur les énoncés,
la géopolitique pèse désormais 7 énoncés sur 33: quiconque juge ce poids
excessif peut le constater, la formule est publique.

Règles d'écriture auditables:

- **Une seule proposition par énoncé.** Pas de question double ("X ou Y ?").
- **Vocabulaire neutre.** Aucun mot connoté qui oriente la réponse.
- **Équilibre des polarités.** Être "d'accord" ne correspond pas
  systématiquement au même bord politique d'un énoncé à l'autre.
- **Invariance de mesure.** Un énoncé n'est "commun" que s'il désigne la même
  chose dans les deux pays.

Échelle de réponse: -2 (pas du tout d'accord), -1, 0 (neutre/partagé), +1,
+2 (tout à fait d'accord), ou "sans opinion".

### 2.1 Pourquoi le pays est demandé avant le premier énoncé

Le choix du pays n'est pas un filtre d'affichage: il décide de ce qui est
demandé. Deux mesures l'imposent.

**Un même énoncé peut désigner le contraire.** La décentralisation
("les régions et les communes devraient exercer davantage de compétences") est
orthogonale au clivage gauche-droite général en France (rho = -0,04 contre
l'axe lrgen de CHES 2024) et modérément marquée à droite en Belgique (+0,45),
ce qui semble anodin. Sur l'axe libertaire-autoritaire (galtan), elle vaut
-0,35 en France et +0,36 en Belgique: demander plus de pouvoirs régionaux
range un répondant du côté des écologistes en France et des nationalistes
flamands en Belgique. L'énoncé a donc été scindé en deux énoncés propres à
chaque pays. Un test vérifie, pour chaque énoncé commun et chaque axe CHES,
qu'aucune orientation substantielle ne pointe en sens inverse entre les deux
pays.

**Un répondant ne doit être comparé qu'aux partis pour lesquels il peut
voter.** Avec les 24 partis mélangés, le parti le plus proche d'un répondant
tiré au hasard était belge une fois sur deux. La Belgique vote par ailleurs
dans trois collèges électoraux et un bulletin ne porte que les listes du sien:
un électeur wallon ne peut pas voter N-VA. Le collège est donc demandé, avec
l'option explicite de voir les 12 partis belges.

Effet mesuré sur 8 000 répondants simulés cohérents (position d'un parti plus
un bruit gaussien d'écart-type 1), en retrouvant ce parti au premier rang:
France 89,7% avec les 24 partis mélangés, 95,1% avec le corpus et les partis du
pays; Belgique 74,2% contre 90,3%. L'écart entre le premier et le deuxième
parti passe de 3,8 à 5,9 points en France et de 2,8 à 5,3 en Belgique.

### 2.2 Le test express

Le test express compte 14 énoncés, exactement 2 par dimension, propres à chaque
pays. Deux et non un: avec un seul énoncé de "rapport à la connaissance", 8 des
10 courants de cette dimension devenaient inatteignables et un seul d'entre eux
était renvoyé à 80% des répondants. Chaque énoncé express doit séparer les
partis de son pays (écart-type d'au moins 1,0 sur les 12 partis), propriété
tenue par un test.

### 2.3 Le départage adaptatif

Deux énoncés par dimension séparent les partis, mais pas toujours les courants:
les signatures d'archétypes en couvrent trois ou quatre. Mesuré par énumération
exhaustive de toutes les réponses express possibles, **35 archétypes sur 79 en
France et 52 sur 79 en Belgique ne pouvaient jamais être désignés vainqueurs
seuls**. Aucun n'était invisible (la liste des courants à égalité les nomme
tous), mais le badge partageable, lui, retenait le premier archétype déclaré
dans le fichier de données: un arbitrage par l'ordre du fichier, pas par les
réponses.

Deux remèdes étaient possibles et un seul est acceptable. Allonger l'express à
trois énoncés par dimension sépare tous les courants, mais les énoncés qui
séparent le mieux les courants ne sont pas ceux qui séparent le mieux les
partis: en "rapport à la connaissance", la meilleure paire pour les courants
(8 courants sur 10) repose sur un énoncé dont l'écart-type entre partis est de
0,91 en France et 0,76 en Belgique, sous le plancher. Un express fixe plus long
violerait donc la règle de discrimination dans plusieurs dimensions.

Le remède retenu est une question de plus, seulement quand elle sert. Quand une
dimension se termine à égalité, l'application pose l'énoncé commun non répondu
de cette dimension **sur lequel les signatures à égalité divergent le plus**, et
recommence tant qu'une égalité subsiste, dans la limite de deux énoncés
supplémentaires par dimension. La règle est déterministe et publiée: l'énoncé
suivant est une fonction des seules réponses déjà données, donc la séquence
entière est recalculable à la main.

Mesuré sur des répondants qui répondent exactement une signature: les 79
archétypes deviennent atteignables seuls dans les deux pays, pour un coût de
**+3,3 énoncés en France et +4,7 en Belgique** en moyenne, jamais plus de deux
par dimension. Le test express reste un test de 14 énoncés auquel s'ajoutent
quelques départages, pas un test de 21.

Au-delà de deux départages, une égalité qui persiste n'est plus un défaut de
mesure mais une caractéristique du répondant: elle est affichée telle quelle.
Les courants à égalité ne sont jamais nommés avant la réponse, car annoncer ce
que chaque réponse "signifie" orienterait la mesure que l'énoncé sert à
prendre.

## 3. La formule de matching partisan

Pour chaque parti:

```
accord(énoncé) = 1 - |position_utilisateur - position_parti| / 4
proximité      = moyenne pondérée des accords sur les énoncés où
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

### 3.1 L'intervalle de confiance et le groupe de tête

Une proximité est une estimation sur un échantillon d'énoncés, pas une mesure
exacte. Elle est donc publiée avec son intervalle:

```
erreur-type = écart-type des accords / racine(nombre d'énoncés comparés)
intervalle  = proximité ± 1,645 × erreur-type      (niveau 90%)
```

Avec des poids de saillance, l'erreur-type est celle d'une moyenne pondérée à
poids de fiabilité; elle se ramène exactement à la formule ci-dessus quand tous
les poids valent 1.

Un parti appartient au **groupe de tête** si son intervalle recouvre celui du
premier. Quand ce groupe compte plusieurs partis, l'application le dit et ne
désigne pas de vainqueur: sur 8 000 répondants simulés cohérents, le premier et
le deuxième parti se tenaient dans un point d'écart trois fois sur dix. Nommer
un gagnant unique dans cette situation, c'est lire du bruit.

Deux partis à score égal partagent le même rang (1, 2, 2, 4). Le cas existe
réellement: Ecolo et Groen sont codés à l'identique, et les sources disent que
c'est exact, les deux partis ayant présenté une vision institutionnelle commune
le 13 janvier 2024. Mesuré sur 20 000 répondants, ils obtiennent exactement les
mêmes chiffres (1,5% de rang 1, 83,7% de présence dans le groupe de tête).
Aucun des deux n'est avantagé par le classement. Ils restent affichés l'un
au-dessus de l'autre dans la liste, ce qui est une limite d'affichage et non de
calcul.

Un codage avait été inventé pour les distinguer, avant que les sources ne
montrent qu'ils ne divergent pas. Il a été retiré (CHANGELOG-DONNEES.md du 29
août 2026). Inventer une valeur pour départager deux partis est interdit, même
quand l'égalité gêne: deux tests le tiennent, l'un exigeant qu'une divergence
entre partis d'un même collège soit sourcée, l'autre que deux partis identiques
reçoivent le même score et le même rang.

### 3.2 La double lecture: proximité et directionnelle

La proximité récompense mécaniquement un parti codé au centre de chaque
échelle, parce qu'il minimise la distance moyenne à n'importe qui. C'est
mesurable: la corrélation entre l'extrémité du codage d'un parti et sa
probabilité d'être premier vaut -0,90 en France et -0,91 en Belgique.

Une seconde lecture est donc publiée à côté, le modèle directionnel
(Rabinowitz et Macdonald):

```
directionnel = 50 + 50 × (somme des produits position_utilisateur ×
                          position_parti) / (4 × nombre d'énoncés)
```

50 signifie orthogonal. Cette lecture récompense l'accord intense dans le même
sens plutôt que la faible distance, et son biais est inverse: la même
corrélation y vaut +0,65 et +0,64. Les deux lectures peuvent donc désigner des
partis différents, et c'est l'information: un premier rang qui ne survit qu'à
une seule des deux métriques n'en était pas un.

### 3.3 La saillance

Le répondant peut déclarer qu'un énoncé compte double pour lui. La proximité
devient une moyenne pondérée; à poids égaux le résultat est exactement le
résultat non pondéré. La formule reste recalculable à la main.

### 3.4 Un chiffre interprétable à côté du pourcentage

"78% de proximité" ne se lit pas facilement. Le détail de chaque parti indique
donc aussi le nombre d'énoncés où le répondant et le parti sont du même côté et
du côté opposé, la neutralité n'étant d'aucun côté.

## 4. Les archétypes et profils synthétiques

Chaque dimension est associée à des "courants de pensée" (archétypes). Chaque
archétype possède une **signature**: le pattern de réponses qu'un partisan type
de ce courant donnerait. Le score d'un archétype est la similarité entre les
réponses de l'utilisateur et cette signature, par la même formule que ci-dessus.
Les signatures sont publiées avec les données; ce sont des hypothèses
éditoriales contestables énoncé par énoncé.

**Toutes les signatures d'une dimension portent exactement sur les mêmes
énoncés**, et c'est une propriété de correction, pas de style. Les signatures
étaient auparavant partielles: chaque archétype était noté sur son propre
sous-ensemble, si bien qu'une signature à un énoncé atteignait 100% sur une
seule réponse quand une signature à quatre énoncés n'y parvenait presque
jamais. Sur 20 000 répondants simulés, les archétypes à un énoncé gagnaient 15
à 19% du temps et ceux à quatre énoncés 1 à 2%. Deux archétypes partageaient
même une signature identique, ce qui rendait le second inatteignable pour
toujours. Deux tests tiennent désormais la propriété: aucune signature en
double, et répondre exactement une signature la classe première.

Les signatures ne portent que sur les énoncés **communs** aux deux pays: un
courant bâti sur un clivage propre à un pays ne serait pas le même courant dans
l'autre.

**Quand les réponses ne départagent pas, l'application pose une question de
plus, puis le dit.** Sur le test express, deux énoncés par dimension ne
suffisent pas à séparer des signatures qui en couvrent trois ou quatre. Le
départage adaptatif (section 2.3) pose alors l'énoncé qui sépare le mieux les
courants encore à égalité. Si l'égalité survit à deux énoncés supplémentaires,
tous les courants à égalité sont nommés, au lieu de renvoyer le premier déclaré
comme s'il avait gagné.

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

- 33 énoncés ne couvrent pas tout le champ politique.
- Les positions des partis évoluent; chaque codage référence un programme daté.
  Les 72 positions ajoutées avec les six énoncés propres à un pays sont au
  statut `a_verifier` et attendent le double codage contradictoire. Aucune
  position ne peut porter le statut `verifie` sans citation datée et liée, ce
  qu'un test vérifie.
- Deux partis aux positions codées identiques reçoivent le même score et le
  même rang, mais l'un est toujours listé au-dessus de l'autre. L'égalité est
  exacte, l'ordre de lecture ne la montre pas encore.
- Les profils synthétiques sont une simplification assumée, conçue pour la
  discussion, pas pour l'assignation.
- Les signatures d'archétypes reposent sur 3 à 7 énoncés par dimension: la
  granularité est limitée et le premier profil synthétique qui correspond est
  retenu (l'ordre de la liste fait partie des données publiées).
- Le test express seul ne sépare pas tous les courants (35 archétypes sur 79 en
  France, 52 en Belgique, mesurés par énumération exhaustive). Le départage
  adaptatif de la section 2.3 les rend tous atteignables, mais seulement pour un
  répondant cohérent: une personne réellement ambivalente reste à égalité, et
  l'égalité est alors affichée plutôt que tranchée.
- Les caractères de contrôle des liens partagés rejettent toute substitution
  d'un caractère et tout échange de deux réponses voisines. Un échange entre
  deux réponses éloignées échappe encore quand la distance multipliée par
  l'écart des caractères est un multiple de 36.
- La lecture directionnelle et la lecture de proximité ont des biais opposés
  (mesurés à +0,65 et -0,90). Aucune des deux n'est neutre; c'est pourquoi les
  deux sont publiées plutôt qu'une seule choisie.
