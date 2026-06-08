# Gouvernance et feuille de route de crédibilité

L'inattaquabilité d'un outil politique n'est pas une propriété du code: c'est
une propriété de la gouvernance et de la procédure. Ce document décrit les
engagements du projet et le plan d'action pour les tenir.

## 1. Engagements non négociables

1. **Indépendance financière.** Aucun financement partisan, aucune publicité,
   aucune vente ou partage de données. Sources acceptables: dons individuels,
   subventions civic tech publiques ou de fondations (publiées), partenariats
   médias limités à la diffusion (sans contrôle éditorial).
2. **Transparence sur tout ce qui détermine les résultats.** Énoncés, positions
   de partis avec sources et statuts, signatures des courants, formule de
   calcul, méthodologie et ce document: tout est public. Le code source, lui,
   ne l'est pas, et ce choix est dit explicitement (METHODOLOGY.md, préambule):
   la formule publiée est assez simple pour être recalculée à la main, ce qui
   rend les résultats auditables sans le code. Toute correction de donnée est
   consignée, datée et motivée dans le journal public des modifications
   (CHANGELOG-DONNEES.md).
3. **Droit de réponse.** Tout parti évalué peut contester publiquement une
   position qui lui est attribuée. La contestation et sa résolution sont
   publiées.
4. **Symétrie des exigences.** Une critique de biais venant de droite est
   traitée avec la même procédure qu'une critique venant de gauche: vérifiable,
   publique, tracée.
5. **Jamais de consigne de vote**, explicite ou implicite.

## 2. Feuille de route humaine (actions hors code)

### Phase A: fiabilisation du codage (avant l'automne 2026)

- [ ] Recruter 4 à 6 relecteurs bénévoles couvrant le spectre politique
      (au minimum: un sympathisant de la gauche radicale, un social-démocrate,
      un libéral/centriste, un conservateur, un souverainiste/droite nationale).
- [ ] Double codage contradictoire des 448 positions de partis: chaque position
      est codée indépendamment par au moins 2 relecteurs de sensibilités
      différentes; publication du taux d'accord inter-codeurs.
- [ ] Audit des 28 énoncés par le même panel: chaque énoncé doit être jugé
      "lisible sans gêne" par tous les relecteurs (test du Turing idéologique).
- [ ] Passage des positions documentées au statut `verifie` avec citation datée.

### Phase B: comité et auto-positionnement (automne 2026)

- [ ] Constituer un comité consultatif de 3 personnes minimum: un politiste,
      un juriste (droit public/européen), un statisticien ou data scientist.
      Leurs noms sont publiés; leur rôle: valider la méthodologie, arbitrer les
      contestations.
- [ ] Écrire officiellement à chaque parti évalué pour proposer
      l'auto-positionnement sur les 28 énoncés. Publier qui a répondu.
- [ ] En cas d'écart auto-positionnement / codage: afficher les deux, avec
      les justifications de chaque côté.
- [ ] Faire valider les 10 fiches de faisabilité par au moins 2 juristes
      universitaires nommés; viser un partenariat avec une faculté de droit.

### Phase C: red team politique (avant le lancement public)

- [ ] Demander explicitement à 5-10 personnes engagées de chaque bord de
      chercher le biais: dans les énoncés, les labels, les positions des
      partis, les fiches juridiques.
- [ ] Critère de réussite: l'outil doit être critiqué par les deux bords pour
      des raisons opposées, ou par aucun. Une critique unilatérale = un biais
      réel à corriger.
- [ ] Publier la synthèse du red team et les corrections effectuées.

### Phase D: lancement et partenariats (hiver 2026 - campagne 2027)

- [ ] Structure juridique: association loi 1901 (FR) ou ASBL (BE), comptes
      publiés annuellement.
- [ ] Partenariat média pour la campagne présidentielle française 2027
      (modèle "Stemtest": le média diffuse et co-cautionne, le projet garde
      le contrôle méthodologique total).
- [ ] Dossier de presse Mode 2: une fiche de faisabilité = un angle presse.
- [ ] Widget embarquable pour les rédactions.

## 3. Procédure de contestation (dès maintenant)

1. Toute personne (citoyen, chercheur, parti) peut contester une position, un
   énoncé, un label ou une fiche via l'adresse de contact publique du projet,
   **source à l'appui**.
2. L'équipe répond sous 14 jours. La contestation et la réponse sont publiées
   dans un registre public des contestations (anonymisé pour les particuliers
   qui le demandent).
3. Si la source est probante, la correction est faite et consignée dans le
   journal public des modifications; sinon, le refus est motivé publiquement.
4. Les litiges persistants sont arbitrés par le comité consultatif (Phase B).

## 4. Ce que le projet refusera toujours

- Vendre, partager ou monétiser des données d'utilisateurs (il n'y en a pas,
  par construction).
- Tout financement, direct ou indirect, d'un parti, d'un candidat ou d'un
  groupe d'intérêt partisan.
- Publier un classement "des programmes les plus réalistes" ou tout autre
  format qui transforme l'analyse en palmarès.
- Laisser un modèle de langage décider d'un profil ou d'un score sans
  validation humaine de chaque position. Les usages autorisés de l'IA, les
  prompts et les garde-fous sont publiés dans le dépôt public
  "transparence-ia" (charte opposable, pipeline de validation, registre des
  usages).
