# Journal public des modifications de données

Ce journal consigne toute modification des éléments qui déterminent les
résultats de l'outil: énoncés, positions de partis, signatures de courants,
fiches de faisabilité, formule de calcul. Le code dit comment un résultat est
calculé; ce journal dit à partir de quoi, et pourquoi cela a changé. Les deux
sont publics, et celui-ci est daté et motivé entrée par entrée.

Format de chaque entrée: date, élément modifié, ancienne valeur, nouvelle
valeur, motif, source.

---

## 2026-09-01 - L'analyse complète était inatteignable, et rien ne disait la précision d'un résultat

### Le mode long renvoyait au mode court

Signalé par le propriétaire: *« quand on sélectionne le mode long on est poussé
vers le mode rapide et donc au final il est impossible de faire le mode long »*.

Reproduit, et les deux cas se séparent nettement:

- ouvrir directement `crible.eu/test?analyse=complete`: le choix du pays
  apparaît, et l'on répond bien aux 35 énoncés. Correct;
- cliquer « Analyse complète » sur l'accueil: la barre d'adresse affiche
  `?analyse=complete` et c'est l'**écran d'introduction** qui s'affiche. Son
  bouton « Commencer le test » lance l'analyse express. Quinze énoncés, soit
  exactement ce que ce lecteur avait choisi de ne pas faire.

**Cause**: la porte était lue avec `useMemo(() => window.location.search, [])`,
qui s'exécute au premier rendu. Lors d'une navigation côté client, le routeur
affiche la nouvelle page **avant** de valider l'entrée d'historique: ce premier
rendu voit donc encore l'adresse de la page précédente, ne trouve aucune porte,
et la liste de dépendances vide fait qu'il ne regardera plus jamais. La porte
express avait le même défaut, invisible parce qu'aucune porte mène de toute
façon à l'express. Le seul chemin que prennent les lecteurs était donc le seul
qui ne marchait pas.

**Correctif**: la porte est lue dans l'état du routeur (`useSearchParams`) et
non dans `window.location`. Une batterie modélise la navigation côté client (le
routeur connaît la nouvelle requête, le document affiche encore l'ancienne
adresse); l'ancienne batterie ne pouvait pas voir le défaut, car elle
positionnait l'adresse **avant** le rendu, ce qui est le cas du chargement
direct, le seul qui fonctionnait.

### Un résultat ne disait pas sur quoi il reposait

Demandé dans la foulée: *« il faut que la réponse en long form soit bcp plus
précise que celle en form court »*.

Mesuré sur cinq répondants français: le calcul faisait déjà sa part. Sur le
parti de tête, l'intervalle de confiance mesure 16 à 26 points après les quinze
énoncés express, et 13 à 18 après le corpus entier; le groupe des partis que
les réponses ne départagent pas passe de 4-12 à 3-8. Ce qui manquait était
autour:

- rien ne disait sur combien d'énoncés un classement reposait, ni qu'un
  résultat express est un premier tri;
- l'offre de compléter n'existait que sur l'écran d'aperçu, une étape plus tôt,
  et disparaissait définitivement une fois passée. Un lecteur arrivé aux
  résultats en express n'avait **aucun moyen** d'aller plus loin.

Les résultats ouvrent désormais sur ce qu'ils valent: le nombre d'énoncés
utilisés sur le corpus, la largeur de l'intervalle sur le parti de tête, et,
quand l'analyse est inachevée, le bouton qui pose les énoncés restants. Une
analyse complète dit qu'il n'y a plus rien à répondre. Un profil reçu par lien
partagé n'offre pas ce bouton: ce sont les réponses de quelqu'un d'autre, les
compléter reviendrait à répondre à sa place. La comparaison express/complet est
tenue par un test qui échoue si le mode long cesse d'être le plus précis.

### Aussi

- La clé de stockage annoncée dans les mentions légales était `crible_test_v1`
  alors que le code écrit `crible_test_v2`. C'est, de toute la page, ce qu'un
  lecteur peut infirmer le plus vite, et un détail infirmé décrédibilise les
  paragraphes qu'il ne peut pas vérifier aussi facilement. La page lit
  maintenant la constante du code.
- À 375px, « Énoncé 1 / 35 » passait sous le bouton retour flottant. La bande
  occupée par les deux contrôles flottants de la page est désormais réservée
  une fois, par la page elle-même, au lieu que chaque écran redécouvre la
  collision.

---

## 2026-08-31 - Audit d'honnêteté: ce que le site disait de vos données, et ce qu'il en faisait

Le propriétaire du projet a mis en doute le discours du site sur les données
("j'ai l'impression que c'est un mensonge"). Vérification faite, ligne par
ligne et navigateur ouvert. Il avait raison sur plusieurs points, dont le plus
grave était sur la page dont c'est précisément la fonction d'être exacte.

### Google était prévenu de chaque visite, avant tout clic

- **Mesuré** sur l'accueil en production: une simple visite, sans rien cliquer,
  déclenchait `GET accounts.google.com/gsi/client` et `/gsi/style`, avec
  `referer: https://crible.eu/`. Tout visiteur était donc signalé à Google
  comme ayant ouvert un outil de positionnement politique, y compris ceux qui
  ne se connectaient jamais, et un navigateur connecté à Google y joignait ses
  cookies Google.
- Le déclarer aurait été le minimum. **Ne plus le faire est mieux**: le script
  de Google n'est plus chargé qu'au moment où le lecteur appuie sur la bulle de
  compte. Le site dessine d'abord son propre bouton, et cède la place au bouton
  officiel de Google une fois celui-ci chargé. Le coût est un appui de plus,
  que le lecteur avait décidé de faire de toute façon; il est annoncé sur
  l'écran de connexion.
- **Vérifié après correction**, sur un build de production: zéro requête vers
  Google au chargement de l'accueil, une seule après l'appui.

### La page « mentions légales » décrivait un site qui n'existe plus

Elle affirmait, sur un déploiement qui a un compte Google, une API et une base
de données: *« Données collectées: Aucune. Le site n'a ni compte, ni base de
données, ni API »*, puis *« Sans collecte, il n'y a pas de traitement de
données personnelles au sens du RGPD, donc pas de base légale à invoquer »*, et
enfin, sur vos droits, *« Il n'y en a aucune ici »*. Le texte avait été écrit
pour le site sans serveur et n'avait pas suivi les fonctionnalités ajoutées.

- Réécrite entièrement, et **branchée sur la configuration réelle**: elle
  énumère ce qui est enregistré (compteur agrégé, profil chiffré), la base
  légale (consentement explicite, article 9.2.a, les opinions politiques étant
  des données sensibles), la durée de conservation, les droits et le bouton qui
  les exerce, les transferts hors UE, et ce que voient les hébergeurs.
- Le tableau des sous-traitants nommait **Plausible**, que ce déploiement ne
  charge pas, et omettait **Cloudflare** et **Google**, qu'il contacte. Corrigé,
  et chaque ligne est désormais liée au drapeau qui l'active.
- Un déploiement sans serveur, lui, continue de dire qu'il ne collecte rien:
  c'est vrai, et il ne doit pas s'excuser d'une base qu'il n'a pas.

### Trois autres affirmations rendues exactes

- **« Au plus deux appels vers notre API »**: il y en a trois. La lecture des
  statistiques publiques part au chargement de l'accueil, avant tout clic, et
  n'avait jamais été comptée. Un lecteur suivant nos propres instructions
  ("ouvrez l'onglet Réseau") en trouvait un de plus qu'annoncé.
- **Ce que le serveur reçoit à la connexion**: le jeton Google est un JWT qui
  contient votre adresse e-mail, votre nom et votre photo. Il part vers l'API
  dans l'en-tête `Authorization`. Le serveur n'en garde rien (il ne lit que
  l'identifiant de compte, les journaux sont désactivés), mais il **le reçoit**.
  Dire seulement « la base ne contient pas votre e-mail » était vrai et
  incomplet. C'est maintenant écrit, avec le moyen de le vérifier soi-même.
- **Les adresses IP**: elles sont vues par les hébergeurs à chaque requête, et
  l'API en fait une utilisation éphémère (compter les appels par minute, pour
  borner les abus). Rien n'est stocké. La page ne parlait que de ce qui n'est
  pas enregistré.

### Ailleurs

- L'accroche de l'accueil promettait « sans compte, sans collecte de données »
  sur un build qui demande un compte pour lire ses résultats.
- La page partenaires terminait sa section données ouvertes sur « sans collecte
  de données », et un partenaire le répétait à ses propres lecteurs.
- `README.md` et `.env.local.example` annonçaient à un développeur qu'il n'y a
  « pas de base de données » et « aucun appel à une API tierce ».
- `api/README.md` décrivait encore le modèle de clé abandonné le 29 août (« la
  clé ne quitte jamais l'utilisateur, code de récupération »).

Toutes ces affirmations sont désormais tenues par une batterie de tests qui
échoue si une page nie un flux que le build réalise, ou en déclare un qu'il ne
peut pas faire (`__tests__/statedDataFlowsAreReal.test.tsx`).

### Passe d'alignement du dépôt

Une fois les pages corrigées, tout ce qui décrit le système a été relu contre le
système:

- **Pondération des statistiques**: le diviseur 33 est plus petit que le corpus
  français depuis le 30 août. Aucun poids ne dépassait 1 (la formule est bornée),
  donc rien n'était faux dans les compteurs, mais la description l'était: ce 33
  est une **longueur de référence fixe**, pas la taille du corpus. Un diviseur
  par pays rendrait une passe express française plus légère qu'une belge, alors
  que ces compteurs existent pour comparer les deux. Écrit tel quel dans
  `lib/analysisStatEvent.ts` et METHODOLOGY.md §8.1, et tenu par un test qui
  vérifie qu'une passe intégrale vaut exactement une analyse dans les deux pays.
- **« 7 énoncés sur 33 »** (poids de la géopolitique, METHODOLOGY.md §4): c'est
  7 sur 35 en France et 7 sur 33 en Belgique.
- **« 33 énoncés par répondant »** et **« les 33 énoncés de chaque pays »**
  (README): corrigés, avec le renvoi vers `announcedLength`, qui dérive le
  chiffre du corpus au lieu de le coder en dur.
- **« vingt-deux fichiers de test »** (README): il y en a 62.
- **« Vos réponses ne quittent jamais votre appareil »**, sous chaque énoncé du
  questionnaire: un absolu qui cesse d'être vrai trois écrans plus loin sur un
  build qui propose de sauvegarder. La phrase était de plus recopiée dans deux
  composants, ce qui est la façon dont une phrase dérive. Elle vit maintenant à
  un seul endroit (`answersStayHereSentence`) et lit le drapeau: « rien n'est
  envoyé tant que vous ne le demandez pas » quand la sauvegarde existe, l'absolu
  quand rien ne peut jamais partir.
- **« no IP »** (README, api/README): la nuance manquait. Aucune adresse n'est
  stockée, mais le limiteur de débit en lit une par requête pour nommer un
  compteur éphémère. C'est ce que dit déjà la page confidentialité.

### Les liens de partage v3, et le silence qui les accompagnait

Décision du propriétaire: **on laisse tomber** les liens créés avant le
30 août 2026. L'outil avait quelques jours, ils étaient peu partagés, et figer
une liste d'énoncés par génération de corpus serait un impôt permanent sur
chaque énoncé ajouté ensuite. C'est consigné dans le test pour que la question
ne soit pas rouverte comme un oubli.

Ce qui n'était pas acceptable, en revanche, c'est que l'échec soit muet:
`/test#p=<code périmé>` retombait sur l'écran d'accueil du questionnaire sans un
mot. Quelqu'un qui suivait le lien d'un proche voyait la porte d'entrée et ne
pouvait pas distinguer un lien mort d'une erreur de sa part. Le code reste
refusé (le lire contre le corpus actuel afficherait un profil jamais calculé),
mais le refus est maintenant annoncé, avec la raison et la marche à suivre.

---

## 2026-08-31 - Compte requis pour ouvrir ses résultats, et quatre chiffres faux corrigés

### Une connexion Google avant d'afficher ses propres résultats

- Sur un déploiement qui offre la sauvegarde de profil, l'analyse se fait sans
  compte mais les résultats s'ouvrent après connexion depuis la bulle en haut à
  droite. C'est **une décision de produit, pas un contrôle de sécurité**, et
  c'est écrit tel quel dans le code, sur la page Confidentialité et dans la
  méthodologie: le calcul est public et s'exécute dans le navigateur, donc la
  porte ne garde aucun secret et n'empêche personne de recalculer le même
  résultat.
- **Ce que la porte ne touche pas**: un déploiement sans compte configuré ne
  l'affiche jamais (sinon un mur que personne ne peut franchir), un profil reçu
  par lien partagé reste lisible sans compte, le questionnaire n'est pas
  concerné, et les réponses restent sur l'appareil, porte ouverte ou fermée.
- La condition est annoncée **avant le premier énoncé**, sur l'écran
  d'introduction, et non découverte au dernier écran.
- Les pages qui promettaient "aucun compte requis" ne le promettent plus quand
  c'est faux: page Confidentialité, écran d'introduction et METHODOLOGY.md §8
  disent maintenant lequel des deux déploiements est servi.

### Quatre affirmations chiffrées fausses

Trouvées en auditant le site contre sa propre promesse ("vérifiez-nous plutôt
que de nous croire"). Aucune ne changeait un résultat, toutes annonçaient au
lecteur un questionnaire qui n'existe pas:

| Où | Disait | Dit |
|---|---|---|
| Accueil, porte "Analyse complète" | 38 énoncés | 33 à 35 énoncés |
| Accueil, bandeau de chiffres | 38 énoncés sur 7 dimensions | 38 énoncés **au catalogue**, 33 à 35 posés selon le pays |
| Choix du pays, ligne France | 33 énoncés dont 3 propres au débat français | 35 énoncés dont 5 propres au débat français |
| Méthodologie, §2 | sous-ensemble express de 12 | 15 |

Personne ne répond 38: c'est l'union des deux corpus nationaux. Un répondant
français en voit 35, un belge 33. Les compteurs sont désormais calculés depuis
le corpus et non recopiés à la main, et une batterie de tests interdit
d'annoncer une longueur que personne ne répond.

### Ordre de sourçage mesuré

- Nouveau document `docs/sourcing-priority.md`, généré par
  `scripts/sourcing-priority.ts`: pour chacune des 816 positions codées, la part
  d'un panel de 200 répondants dont le **groupe de tête change** si cette seule
  position bouge d'un cran. Sourcer dans cet ordre change des résultats;
  sourcer dans un autre ordre n'en change pas.
- Résultat principal: les positions du MoDem et de Renaissance dominent la
  liste française. Un parti codé au centre est proche du plus grand nombre de
  répondants, donc c'est lui qui fait basculer le classement.
- Un cliquet dans la suite de tests interdit désormais au nombre de positions
  sourcées de diminuer (55 nomment une source, 8 la lient, mesuré le 30 août).

### Liens de partage: une fixture périmée, et un défaut à trancher

- L'intégration continue échouait depuis le 30 août sur deux cas du contrôle de
  confidentialité. Cause mesurée: le code de partage français utilisé par le
  contrôle avait été frappé quand la France comptait 33 énoncés, elle en compte
  35, et un code v3 est relu **contre le corpus actuel**. Fixtures régénérées,
  et un test les attache désormais au corpus pour qu'elles ne pourrissent plus
  en silence.
- **Défaut non corrigé, décision à prendre**: un lien "Garder mes résultats" au
  format v3 meurt quand le corpus change. Les formats v1 et v2 avaient été gelés
  contre leur propre liste d'énoncés précisément pour éviter cela; v3 n'a pas
  repris la leçon. Les liens émis avant le 30 août 2026 sont donc morts. Les
  ressusciter suppose de geler une liste par génération de corpus.

---

## 2026-08-30 - Un seul endroit pour se connecter

- **Suppression de `RestoreProfileCard`** (la carte "Déjà un profil sauvegardé ?"
  sur l'accueil du test) et **du bouton Google de la carte de sauvegarde**. La
  connexion se fait désormais uniquement depuis la bulle en haut à droite.
- **Motif**: demandé par un lecteur. Trois boutons Google sur trois écrans
  laissent croire à trois comptes différents; un seul point de connexion rend
  l'état "connecté / déconnecté" lisible d'un coup d'oeil.
- **Conséquence technique**: le jeton d'identité Google est conservé en
  mémoire, jamais dans le stockage du navigateur; la carte de sauvegarde
  l'utilise et, s'il a expiré ou si la page a été rechargée, renvoie vers la
  bulle. La bulle réapparaît sur l'écran de résultats de /test, seul écran de
  cette adresse qui propose une sauvegarde.
- **Ajout sur la page Confidentialité**: ce que la connexion laisse sur
  l'appareil (prénom et photo Google) et ce qu'elle n'y laisse pas (le jeton).

## 2026-08-29 (nuit, 5) - Les combats déclarés, relus dans les programmes

- **Retrait de la couche de saillance CHES 2024** (`data/partySalience.ts`,
  ajoutée quelques heures plus tôt le même soir) et **remplacement** par
  `data/partyFights.ts`: pour chacun des 24 partis, deux à quatre combats lus
  dans son propre programme, dans l'ordre où le document les présente, avec le
  document en lien, l'année, la citation exacte quand elle existe, et le même
  statut de sourçage que les positions ("codage préliminaire").
- **Motif**: signalé par un lecteur. Le panel CHES note 22 partis sur 24 et
  ignore ceux qui n'atteignent pas ses seuils d'inclusion (UPR, Les
  Patriotes), qui portaient donc une "estimation documentée" pendant que les
  autres portaient un chiffre. Le panneau renseignait sur la portée du jeu de
  données plus que sur les partis. Règle retenue: tous les partis, même
  traitement, même type de source.
- **Nouvelle règle explicite**: un combat déclaré que les 35 énoncés ne posent
  pas (logement, école) ne reçoit aucune dimension et est marqué "hors
  questionnaire", au lieu d'être rattaché de force à une dimension voisine.
- **Sources ajoutées** (une par parti, exemples): UPR, "Libérons-nous de l'UE,
  de l'€, de l'OTAN" (upr.fr); Les Patriotes, "Grandes orientations pour un
  projet patriote" (livret de septembre 2025), qui pose le Frexit comme "clé
  de voute" et énumère UE, Euro, Schengen, CEDH, OTAN, OMS; Reconquête, les
  huit priorités en "I"; PTB, ses quatre engagements affichés; Vlaams Belang,
  "Vlaanderen onafhankelijk" en tête de programme; N-VA, "Voor Vlaamse
  welvaart" (programme 2024).
- **À corriger prochainement (signalé par cette relecture)**: Open Vld a changé
  de nom en janvier 2026 et s'appelle désormais "Anders". Le corpus affiche
  encore "Open Vld"; l'entrée de combats le mentionne, le nom du parti n'a pas
  encore été modifié.
- **Effet sur les résultats**: aucun. Les combats déclarés sont un affichage,
  jamais une entrée du calcul (METHODOLOGY.md 3.5).

## 2026-08-29 (nuit, 4) - Une seule lecture, et "à égalité" veut dire égalité

- **Retrait de la lecture directionnelle** (`lib/resultsReading.ts` supprimé,
  `directionalScore` retiré du moteur): le modèle de Rabinowitz-Macdonald
  classait devant un parti plus radical que le répondant, avant le parti qui
  dit exactement ce qu'il dit. Deux scores dont l'un contredit l'intuition
  sans être explicable en une phrase compliquent sans informer. Ce qui reste:
  la proximité, son biais central écrit sur la page, et les comptes "même
  côté / côté opposé" qui portaient déjà l'intuition directionnelle.
- **Nouvelle règle du badge "à égalité en tête"**: il n'apparaît que si le
  pourcentage affiché est identique à celui du premier. Le résultat du test
  apparié (les partis que les réponses ne départagent pas) est désormais écrit
  en toutes lettres sous la liste, au lieu d'être posé en badge à côté de
  chiffres différents.
- **Motif**: signalé par un lecteur, "arrête d'écrire à égalité en tête quand
  il n'y a pas le pourcentage exact". Un badge se lit, un test statistique se
  lit en phrase; les deux informations restent publiées, chacune sous la forme
  qui ne ment pas.
- **Effet sur les résultats**: aucun changement de calcul, ni de scores, ni de
  classement. Le groupe de tête apparié reste calculé et publié.

## 2026-08-29 (nuit, 3) - Les combats déclarés des partis (saillance CHES 2024)

- **Ajout** (`data/partySalience.ts`): les neuf variables de saillance du
  CHES 2024 (`eu_salience`, `lrecon_salience`, `galtan_salience`,
  `immigrate_salience`, `multicult_salience`, `redist_salience`,
  `climate_change_salience`, `environment_salience`, `anti_elite_salience`,
  échelle 0-10) copiées du dataset officiel `CHES_2024_final_v2.csv` pour les
  22 partis du corpus couverts par le panel, arrondies à 2 décimales comme
  les positions de `data/ches.ts`.
- **UPR et Les Patriotes** (sous les seuils d'inclusion du CHES): pas de
  valeurs inventées; le combat déclaré de leur propre programme, marqué
  "Estimation documentée" (UPR: sortie de l'UE, de l'euro et de l'OTAN;
  Les Patriotes: Frexit et sortie de l'euro).
- **Motif**: demande d'un lecteur ("voir si mes combats matchent avec les
  vrais sujets prioritaires des partis"), servie par une mesure externe
  plutôt que par notre lecture des programmes. La saillance n'entre pas dans
  le calcul des scores: affichage seulement (METHODOLOGY.md 3.5).
- **Source**: CHES 2024, Jolly et al., dataset et codebook publics
  (chesdata.eu), valeurs relues depuis le CSV officiel le 2026-08-29.

## 2026-08-29 (nuit, 2) - Chaque famille synthétique décrit les sept dimensions

- **Modification des 14 familles** (`data/syntheticProfiles.ts`): chacune
  décrivait une à trois dimensions et se taisait sur les autres; chacune
  décrit désormais les sept, avec plusieurs courants acceptés sur une
  dimension quand la famille a plusieurs ailes (alternatives, jamais une
  moyenne).
- **Motif**: demande d'un lecteur, et elle était juste. Un "profil" qui ne dit
  rien sur cinq dimensions sur sept ne nomme presque rien; le silence
  maintenait aussi 4 familles en médiane dans le groupe de tête d'un répondant
  cohérent, et 4 paires indiscernables.
- **Remesuré après modification**: plus aucune paire de familles en
  contradiction sur au moins une dimension n'est indiscernable (la liste gelée
  de 4 paires est vide); groupe de tête d'un clone de parti: médiane 3 (FR) et
  2 (BE), contre 4 avant.
- **Effet sur les liens déjà partagés**: un code de badge encode les courants,
  jamais la famille, qui est recalculée à l'affichage. Un ancien lien peut
  donc afficher une famille mieux ajustée qu'au jour de l'envoi. Le témoin
  gelé `28234225` est passé de "Conservateur enraciné" à "Souverainiste
  républicain d'ordre", et ce déplacement est motivé: ordre + protectionnisme
  + productivisme + pragmatisme correspondent à la description complète du
  souverainisme d'ordre, quand le conservateur enraciné attend une écologie
  bio-conservatrice et une spiritualité que ces courants ne portent pas.

---

## 2026-08-29 (nuit) - Sorties formulées de l'UE et de l'OTAN + groupe de tête apparié

- **Ajout de 2 énoncés à portée France** (ge8_fr "La France devrait quitter
  l'Union européenne", ge9_fr "La France devrait quitter l'OTAN, et pas
  seulement son commandement intégré") et de 24 positions.
- **Motif**: signalement d'un lecteur. Seuls l'UPR et Les Patriotes ont inscrit
  la sortie de l'UE à leur programme (et, avec LFI, la sortie de l'OTAN), mais
  le corpus ne les distinguait pas des partis qui veulent renégocier de
  l'intérieur: sur "reprendre des compétences à l'UE" (ge1), le RN était codé
  +2 comme l'UPR. Le +2 des nouveaux énoncés est réservé aux partis dont le
  programme formule la sortie elle-même; renégocier, désobéir aux traités ou
  quitter le seul commandement intégré sont codés comme des réponses
  différentes (-1). Statut "a_verifier" comme le reste du corpus, sources en
  libellé sur les positions non triviales. Aucune surpondération éditoriale:
  la séparation vient de l'écart des positions documentées (+2 contre -1/-2).
- **Portée France uniquement**: aucun parti belge disposant d'un élu ne propose
  l'une ou l'autre sortie; l'énoncé n'y séparerait rien.
- **Changement de règle du groupe de tête des partis**: le recouvrement des
  deux intervalles individuels est remplacé par la comparaison appariée énoncé
  par énoncé, la même que pour les familles (METHODOLOGY.md §3.1). Mesuré avant
  correction: 12 partis sur 12 "à égalité en tête" en médiane pour un répondant
  peu cohérent, écarts jusqu'à 20 points appelés égalité, groupe non préfixe du
  classement. Après: groupe médian de 1 pour un sympathisant simulé (80% des
  réponses de son parti). Batterie: __tests__/partyLeadingGroup.test.ts.

## 2026-08-29 (soir) - La famille affichée devient la plus proche, et le groupe de tête est publié

- **Motif, mesuré**: les 14 familles synthétiques étaient des prédicats booléens
  lus dans l'ordre du fichier. Sur 5 000 répondants simulés, le test express
  belge décidait 55 à 58% des résultats par la position d'une entrée dans
  `data/syntheticProfiles.ts`, trois familles étaient inatteignables quoi que
  l'on réponde ("Souverainiste républicain d'ordre", "Multilatéraliste de la
  raison", "Égalitariste des luttes croisées"), et 8 à 23% des analyses
  ressortaient sans nom ("Profil singulier").
- **Changement de données**: chaque famille ne déclare plus une fonction de test
  mais **ce qu'elle attend**, dimension par dimension (`expects`), c'est-à-dire
  les courants qu'elle accepte là où elle se prononce. Les alternatives d'une
  même dimension sont conservées séparées et jamais moyennées: la moyenne d'une
  géopolitique souverainiste et d'une géopolitique atlantiste est une troisième
  position que ni l'une ni l'autre ne tient, et c'est ce qui rendait
  "Néoréaliste stratège" inatteignable.
- **Changement de calcul**: la famille nommée est la plus proche du pattern de
  réponses que représentent les courants dominants du répondant. Résultat mesuré:
  0% d'analyse sans nom, 14 familles sur 14 atteignables, famille la plus
  fréquente ramenée de 40,6% à 21%, et indépendance à l'ordre du fichier tenue
  par un test qui inverse la liste et compare.
- **Deuxième mesure, qui a décidé de la suite**: un répondant qui reproduit
  exactement les positions documentées d'un parti n'est séparé de la deuxième
  famille que par 1 point sur 100 en médiane, et un tiers de ces répondants sont
  à égalité parfaite. Nommer une seule famille en grand présenterait un tirage au
  sort comme un résultat. L'outil publie donc un **groupe de tête** de familles,
  comme il le fait déjà pour les partis, par comparaison **appariée** énoncé par
  énoncé. En traitant les deux scores comme indépendants, le groupe contenait
  10 familles sur 14 en médiane et 19 paires de familles aux courants opposés
  étaient déclarées indiscernables; apparié, la médiane tombe à 4 sur 14 et il
  reste 4 paires, toutes impliquant une famille qui ne décrit qu'une ou deux
  dimensions sur sept. Ces 4 paires sont gelées dans un test.
- **Effet sur un lien déjà partagé**: le badge `2046354a` continue de décoder
  exactement les mêmes sept courants dominants (le badge n'a pas changé de
  signification), mais la famille qui en est dérivée passe de
  "Gaulliste social-étatiste" à "Égalitariste des luttes croisées". Un
  internationaliste tiers-mondiste également libertaire hédoniste n'était appelé
  gaulliste que parce que cette entrée était déclarée plus haut dans le fichier.
- Aucun énoncé, aucune position de parti et aucune signature de courant n'est
  modifié par cette entrée.

## 2026-08-29 (nuit, suite) - Le test express pose la question du Proche-Orient

- **Motif**: les trois clivages géopolitiques ajoutés dans la nuit n'entraient
  pas dans le test express, qui posait UE + immigration (France) et OTAN +
  immigration (Belgique). Un répondant express ne voyait donc jamais l'énoncé
  israélo-palestinien, alors que c'est lui qui sépare des partis que les paires
  d'origine disaient voisins.
- **Changement**: la géopolitique reçoit une troisième place express, le même
  triplet dans les deux pays: OTAN (`ge2`), immigration (`ge3`),
  conflit israélo-palestinien (`ge7`). Le test express passe de 14 à
  15 énoncés. La France perd l'énoncé UE (`ge1`) de l'express, qui reste dans
  le test complet.
- **Mesure qui a décidé** (simulation, bruit d'écart-type 1,0, 300 tirages par
  parti, énumération de toutes les paires et tous les triplets éligibles au
  plancher d'écart-type 1,0): le triplet retenu bat toutes les paires et tous
  les autres triplets sur la récupération du bon parti en France (93,7% contre
  93,0% pour l'ancienne paire) et fait mieux que l'ancienne paire en Belgique
  (90,2% contre 89,4%). Sur les seuls énoncés géopolitiques express, l'écart
  RN-LFI passe de 5 à 9 points, l'écart Vlaams Belang-PTB de 5 à 8.
- Aucun changement de codage ni de signature; seule la sélection express
  change, et la règle passe de "exactement 2 par dimension" à "2 par
  dimension, 3 en géopolitique", tenue par le test mis à jour.

## 2026-08-29 (nuit) - La géopolitique gagne trois clivages qui lui manquaient

- **Motif, mesuré**: hors immigration, les quatre énoncés géopolitiques (UE,
  OTAN, immigration, intervention extérieure) séparaient le RN de LFI de
  **2 points sur 12 possibles**: les deux partis convergent sur la souveraineté
  et la distance à l'OTAN. Les clivages qui les opposent réellement (Ukraine,
  Russie, Proche-Orient) étaient absents du corpus. Un répondant aux positions
  géopolitiques de LFI et neutre ailleurs obtenait RN 65 / LFI 68, quasi
  indiscernables.

### Énoncés ajoutés (communs aux deux pays)

- **`ge5`** "Mon pays doit poursuivre son soutien militaire à l'Ukraine, même
  si cela a un coût pour lui."
- **`ge6`** "À terme, mon pays devra renouer des relations économiques et
  diplomatiques normales avec la Russie."
- **`ge7`** "Dans le conflit israélo-palestinien, mon pays doit soutenir en
  priorité Israël."

Le corpus passe à 30 énoncés communs + 3 par pays = 33 par répondant. La
géopolitique porte désormais 7 énoncés là où les autres dimensions en portent
4: la proximité étant une moyenne, ce poids accru de la dimension est un choix
éditorial assumé et publié (METHODOLOGY.md §2).

### Positions ajoutées: 72 (24 partis x 3 énoncés), toutes `a_verifier`

Codées depuis des votes, communiqués et programmes 2024-2026, réunis par
recherche documentaire le 29 août 2026. Les positions les plus tranchées
portent une citation datée: adhésion officielle de LFI au BDS (3 décembre
2024), votes du RN contre les résolutions ukrainiennes au Parlement européen
(17 juillet 2024), reconnaissance de la Palestine par la France à l'ONU
(22 septembre 2025), accord belge sanctions + reconnaissance (2 septembre
2025), ligne Bouchez au MR, opposition du PTB aux livraisons d'armes. Les
positions déduites d'une participation gouvernementale (partis de la coalition
Arizona sur l'Ukraine) sont codées prudemment à ±1 et attendent le double
codage. Ecolo et Groen restent codés à l'identique, conformément à leurs
positions communes.

### Signatures étendues

Les 11 archétypes géopolitiques couvrent désormais ge5-ge7 (signatures
complètes obligatoires). Codage éditorial publié, contestable énoncé par
énoncé via GOVERNANCE.md.

### Ce que la mesure dit après, redondance comprise

- Écart RN-LFI en géopolitique: 6 -> **10 points** (l'énoncé israélo-palestinien
  en apporte 4 à lui seul). Le répondant simulé "géopolitique LFI, neutre
  ailleurs" obtient désormais LFI 70 / RN 65, et LFI premier en lecture
  directionnelle.
- **`ge7` est un axe réellement nouveau**: corrélation de 0,08 avec le clivage
  Est-Ouest sur les positions des 24 partis; écarts-types 1,40 (FR) et
  1,16 (BE).
- **`ge5` et `ge6` sont fortement corrélés à l'axe OTAN existant** (0,84 à 0,95
  en valeur absolue): ils ajoutent du poids à ce clivage plus qu'un axe
  indépendant, et séparent peu les partis belges (écarts-types 0,95 et 0,75,
  consensus ukrainien large). Dit tel quel plutôt que caché.
- Coût du départage adaptatif inchangé (+0,49 énoncé par dimension en France,
  +0,71 en Belgique, maximum 2), les 79 archétypes restent atteignables.

### Liens partagés: version 3

Le corpus ayant grandi, les codes passent en version 3 (même format, corpus de
33). Les codes version 2 du 29 août restent lisibles pour toujours: leur corpus
de 30 énoncés est gelé dans le décodeur, et les trois énoncés nouveaux sont
simplement sans réponse pour eux. Vérifié par test et par le contrôle de
confidentialité (6 générations de liens).

## 2026-08-29 (soir) - Correction d'un codage inventé, départage adaptatif

### Ecolo et Groen: la différenciation est retirée

- **Motif**: la différenciation introduite le matin même sur `pw3_be` (Ecolo -1,
  Groen 0, "fédéralisme rénové") n'était appuyée sur aucune source. Recherche
  documentaire faite ensuite: **Ecolo et Groen ont présenté une vision
  institutionnelle commune le 13 janvier 2024**, "du fédéralisme de blocage au
  fédéralisme collaboratif", avec la même architecture (quatre régions, un
  fédéral arbitre, refédéralisation ciblée de la santé, du climat, de la justice
  et de la mobilité). Ils ne divergent pas sur ce sujet.
- **Correction**: Groen repasse à -1, identique à Ecolo, et les deux positions
  sont désormais **sourcées** (communiqué commun Ecolo du 13 janvier 2024, page
  Groen "Samenwerkingsfederalisme in plaats van blokkeringsfederalisme").
- **Ce que la mesure disait vraiment**: le constat "Groen n'est jamais premier,
  0 fois sur 20 000" était un artefact de la mesure, qui prenait le premier
  élément d'une liste triée. L'application, elle, partage les rangs entre partis
  à score égal. Re-mesuré après correction sur 20 000 répondants: Ecolo et Groen
  obtiennent exactement les mêmes chiffres (1,5% de rang 1 partagé, 83,7% de
  présence dans le groupe de tête). Aucun des deux n'est désavantagé.
- **Règle tirée de l'épisode**: inventer une valeur pour départager deux partis
  est interdit, même quand l'égalité gêne. Deux tests le tiennent désormais:
  toute divergence entre deux partis d'un même collège doit être sourcée, et
  deux partis aux positions identiques doivent recevoir le même score et le
  même rang.

### Départage adaptatif après le test express

- **Motif**: mesuré par énumération exhaustive de toutes les réponses express
  possibles, 35 archétypes sur 79 en France et 52 sur 79 en Belgique ne
  pouvaient jamais être désignés vainqueurs seuls. Aucun n'était invisible, mais
  le badge partageable retenait le premier archétype déclaré dans le fichier,
  soit un arbitrage par l'ordre des données.
- **Changement**: quand une dimension se termine à égalité, l'application pose
  l'énoncé commun non répondu de cette dimension sur lequel les signatures à
  égalité divergent le plus, dans la limite de deux par dimension. Aucun énoncé
  ni aucune signature n'est modifié: c'est l'ordre des questions qui devient
  adaptatif.
- **Mesure**: les 79 archétypes deviennent atteignables seuls dans les deux
  pays, pour +3,3 énoncés en France et +4,7 en Belgique en moyenne.
- **Ce qui n'a pas été fait, et pourquoi**: allonger le test express à trois
  énoncés par dimension séparait aussi tous les courants, mais les énoncés qui
  séparent le mieux les courants ne sont pas ceux qui séparent le mieux les
  partis (en "rapport à la connaissance", la meilleure paire repose sur un
  énoncé d'écart-type 0,91 en France, sous le plancher publié de 1,0).

### Liens partagés

- **Deuxième caractère de contrôle**, pondéré par la position. La somme simple
  ne voyait pas l'échange de deux réponses. Tout échange de deux réponses
  voisines est désormais rejeté. Un échange entre deux réponses éloignées passe
  encore quand la distance multipliée par l'écart des caractères est un multiple
  de 36, et cette limite est publiée.
- Les codes de version 2 déjà partagés dans la journée ne sont plus lisibles:
  ils comptaient un caractère de contrôle et non deux. Le format n'avait pas
  quitté le poste de développement.

### Sourçage

- **Nouvelle règle tenue par un test**: aucune position ne peut porter le statut
  `verifie` sans une citation datée ET liée. La règle figurait dans
  GOVERNANCE.md, rien ne l'empêchait d'être contournée.

## 2026-08-29 - Portée par pays, signatures complètes, incertitude publiée

- **Motif**: audit du moteur par simulation (20 000 répondants uniformes, 8 000
  répondants cohérents, ACP sur la matrice partis x énoncés). Quatre défauts
  mesurés: un énoncé commun désignait le contraire selon le pays, un archétype
  était inatteignable, un parti n'était jamais premier, et le classement des
  partis était annoncé sans son incertitude.

### Énoncés

- **Scindé** `pw3` (décentralisation) en `pw3_fr` et `pw3_be`. L'énoncé
  n'était pas invariant: orientation -0,35 en France et +0,36 en Belgique sur
  l'axe galtan de CHES 2024. Les valeurs françaises sont reprises telles
  quelles; les valeurs belges sont un codage nouveau du clivage communautaire
  (transfert de compétences fédérales), au statut `a_verifier`.
- **Ajouté 3 énoncés propres à la France** (`pw3_fr` décentralisation,
  `ec5_fr` retour de l'âge légal à 62 ans, `so5_fr` application stricte de la
  laïcité) et **3 propres à la Belgique** (`pw3_be` transfert de compétences,
  `ec5_be` limitation dans le temps des allocations de chômage, `so5_be`
  régularisation des personnes sans titre de séjour de longue durée).
  Motif: sans clivage communautaire ni débat social propre, les partis belges
  étaient trop resserrés pour être distingués (récupération du bon parti
  74,2% contre 89,7% côté français).
- **Total**: 27 énoncés communs + 3 par pays = 30 par répondant.
- **Nouvelles positions**: 72 (12 partis x 3 énoncés x 2 pays), toutes au
  statut `a_verifier`.

### Test express

- **Porté de 12 à 14 énoncés**, exactement 2 par dimension et par pays. Avec un
  seul énoncé de "rapport à la connaissance", 8 des 10 courants de la dimension
  étaient inatteignables et "Sceptique cartésien" était renvoyé à 80,2% des
  répondants.
- **Retiré `ec3`** (protectionnisme) de la sélection express: écart-type 0,88
  sur 24 partis, il occupait une place sur douze sans séparer les partis.
  Critère publié et testé: un énoncé express sépare les partis de son pays avec
  un écart-type d'au moins 1,0.

### Signatures des courants

- **Réécrites en signatures complètes**: chaque archétype d'une dimension porte
  désormais sur exactement les mêmes énoncés communs. Les signatures partielles
  favorisaient mécaniquement les plus courtes (15 à 19% de victoires à un
  énoncé contre 1 à 2% à quatre énoncés).
- **Corrigé un doublon**: "Technocrate rationaliste" et "Élitiste éclairé"
  avaient la signature identique `{pw1: 1, pw2: -2}`. "Élitiste éclairé" n'a
  jamais été renvoyé une seule fois sur 20 000 tirages. Sa signature est
  désormais distincte (`pw4: 0` au lieu de `pw4: 1`).
- **Résultat mesuré**: 0 archétype sur 79 inatteignable sur le test complet
  (contre 1 auparavant, et une distribution dictée par la longueur des
  signatures).
- Aucun libellé d'archétype n'a été supprimé ni renommé: `badgeAlphabet.ts`
  reste inchangé et les liens déjà partagés continuent de désigner la même
  chose.

### Partis

- **Distingué Ecolo et Groen** sur `pw3_be` (Ecolo -1, refédéralisation;
  Groen 0, fédéralisme rénové). Leurs vecteurs étaient rigoureusement
  identiques sur les 28 énoncés, si bien que Groen n'était jamais premier, 0
  fois sur 20 000. Codage préliminaire au statut `a_verifier`, à sourcer.
- **Ajouté les collèges électoraux** des 12 partis belges (Wallonie, Bruxelles,
  Flandre). Motif: un bulletin ne porte que les listes d'un collège, et
  proposer la N-VA à un électeur wallon est proposer un parti pour lequel il ne
  peut pas voter.

### Formule

- **Ajouté l'intervalle de confiance à 90%** de chaque proximité et la notion
  de groupe de tête (intervalles qui se recouvrent). Motif: le premier et le
  deuxième parti se tenaient dans un point d'écart chez 30% des répondants
  simulés cohérents, et un vainqueur unique était annoncé quand même.
- **Ajouté la lecture directionnelle** (Rabinowitz-Macdonald) à côté de la
  proximité. Motif: le biais centriste de la proximité est mesuré à -0,90
  (corrélation entre l'extrémité du codage d'un parti et sa probabilité d'être
  premier); celui de la lecture directionnelle est de +0,65. Publier les deux
  laisse voir de quoi dépend le classement.
- **Ajouté la pondération de saillance** (un énoncé peut compter double), sans
  effet à poids égaux.
- **Ajouté le décompte "même côté / côté opposé"**, interprétable là où un
  pourcentage ne l'est pas.
- **Ajouté le signalement des égalités entre courants** quand les réponses ne
  les départagent pas.

### Format des liens partagés

- **Code de profil version 2**: il porte désormais le pays et une somme de
  contrôle. Motif: les deux corpus comptant 30 énoncés, changer le seul
  caractère de pays d'un code français en faisait un profil belge valide, et un
  lien abîmé en transit affichait un profil plausible attribué à celui qui
  l'avait partagé. Toute substitution d'un caractère est désormais rejetée.
- **Les liens version 1 restent lisibles**. Ne nommant aucun pays, ils
  conduisent au choix du pays en conservant les réponses, plutôt que d'en
  supposer un.

## 2026-06-07 - Fusion "Le Crible Politique": consolidation du corpus

- **Motif**: fusion des deux prototypes en un produit unique (voir
  MERGE_PLAN.md). Un seul corpus de données fait foi désormais.
- **Supprimé**: le corpus "programmes par parti" avec verdicts de faisabilité
  (immediate/improbable/impossible), contraire à la règle "jamais de verdict".
  Le contenu juridique de référence vit dans les 14 fiches établi/débattu;
  la bibliothèque de références officielles (EUR-Lex/CURIA) est conservée.
- **Supprimé**: les matrices d'impact économique par idéologie posées à dires
  d'expert (faille F1 de l'audit interne). L'impact matériel est désormais
  uniquement estimé par le simulateur à barèmes publiés (IPP/OFCE), étiqueté
  comme estimation.
- **Conservé et intégré**: CHES 2024 (provenance par parti), déciles INSEE,
  items MFQ (fondations morales), simulateur d'impact; 28 énoncés, 672
  positions de partis, signatures, 14 fiches (statuts inchangés).

## 2026-06-06 - Équilibrage du Mode 2 + sourçage renforcé

- **Motif**: l'audit interne a relevé qu'aucune mesure du bloc central ou du
  gouvernement n'était analysée (risque de biais perçu: "ils vérifient les
  oppositions, jamais le pouvoir").
- **Ajout de 3 fiches** (statut "préliminaire"): durcissement de l'assurance
  chômage, trajectoire de déficit sous 3% en 2029, SNU obligatoire.
  Total: 14 fiches.
- **Ajout de liens officiels** (EUR-Lex, Conseil constitutionnel) sur les
  sources des fiches existantes qui n'en avaient pas.

---

## 2026-06-06 - Élargissement de la couverture partisane + critère d'inclusion

- **Motif**: l'audit interne a révélé une asymétrie de couverture: côté
  flamand, seuls N-VA et Vlaams Belang étaient représentés (risque de biais
  perçu); côté français, absence de PCF, Horizons et MoDem.
- **Ajout de 8 partis** (224 positions, toutes au statut "a_verifier"):
  Vooruit, Open VLD, CD&V, Groen, DéFI (BE); PCF, Horizons, MoDem (FR).
  Total: 24 partis, 672 positions.
- **Publication du critère d'inclusion** (METHODOLOGY.md §5): partis disposant
  d'au moins un élu au parlement national ou européen; exception documentée
  pour l'UPR et Les Patriotes (propositions institutionnelles analysées en
  Mode 2). Tout parti peut demander son inclusion via la procédure publique.

---

## 2026-06-06 - Création initiale du jeu de données

- 28 énoncés créés (4 par dimension, 7 dimensions), selon les règles
  d'écriture de METHODOLOGY.md §2.
- 448 positions de partis créées (16 partis x 28 énoncés), toutes au statut
  "a_verifier" (codage préliminaire par l'équipe d'après les programmes et
  prises de position publiques, en attente de double codage contradictoire).
- Signatures des courants de pensée créées pour les 7 dimensions.
- 10 fiches de faisabilité créées, toutes au statut "préliminaire" (en attente
  de validation par des juristes extérieurs).
- Formule de matching publiée: accord = 1 - |écart| / 4, moyenne sur les
  énoncés répondus et documentés.
