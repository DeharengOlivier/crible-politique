# Ce qui sépare les partis, mesuré

Généré par `scripts/party-separation.ts`, 300 répondants tirés par graine et par
pays. Mesure du 1er septembre 2026, faite avant toute modification, en réponse à
la demande « que la partie longue soit beaucoup plus tranchée entre les partis,
peut-être en rajoutant des questions qui départageraient plus nettement ».

Trois causes étaient possibles et appelaient trois corrections différentes : un
panel incohérent, des énoncés qui ne discriminent pas, ou des partis réellement
semblables. Les tableaux ci-dessous tranchent.

## Ce que la mesure établit

1. **Le groupe de tête est déjà de 1 parti** pour un répondant cohérent, même
   avec 30 % de ses réponses retirées au hasard. Le chiffre de 3 à 8 partis
   obtenu la veille venait d'un panel uniformément aléatoire, inséparable par
   construction : c'était le mauvais instrument, pas un défaut de l'application.
2. **L'écart entre le 1er et le 2e ne bouge pas** avec la longueur : 5,3 points
   après les quinze énoncés express, 5,6 après le corpus entier. C'est de
   l'arithmétique, pas un réglage : le score est une moyenne sur les énoncés,
   donc en ajouter le fait converger et resserre son intervalle, mais ne
   l'élargit pas. Aucun énoncé de pouvoir discriminant ordinaire ne peut changer
   cela.
3. **Il n'y a rien à élaguer non plus.** Aucun des 35 énoncés français n'a un
   écart-type de positions partisanes inférieur à 0,75, et repondérer le corpus
   par le pouvoir discriminant déplace l'écart de 0,2 point (10,6 -> 10,4).
4. **Les partis de tête sont proches parce qu'ils le sont dans la table codée.**
   Renaissance et Horizons portent la même valeur sur 26 des 35 énoncés
   français ; Ecolo et Groen sur 33 des 33 énoncés belges, ce qui explique 50
   des 66 ex aequo du panel belge. Aucun énoncé ajouté ne les départagera tant
   que leurs positions restent codées de la même façon.

## Ce qui en a été tiré

Le pourcentage ne peut pas être rendu plus tranché sans être faussé. Ce qui
grandit réellement avec la version longue, c'est le nombre d'énoncés sur
lesquels les deux premiers divergent vraiment : mesuré de 2,3 à 3,8 en France et
de 2,2 à 4,4 en Belgique. C'est ce que l'écran de résultats montre désormais
(`lib/partySeparation.ts`, METHODOLOGY.md 3.7), avec le cas où la réponse
honnête est qu'aucun énoncé ne les sépare.


## FR: leading group size, 12 parties

| respondent | express (15) | complete (35) | leader is target |
|---|---|---|---|
| party + 0% noise | median 1, mean 1.0 | median 1, mean 1.0 | 100% |
| party + 10% noise | median 1, mean 1.2 | median 1, mean 1.0 | 100% |
| party + 20% noise | median 1, mean 1.4 | median 1, mean 1.0 | 100% |
| party + 30% noise | median 1, mean 2.1 | median 1, mean 1.2 | 100% |
| party + 50% noise | median 3, mean 3.9 | median 1, mean 2.1 | 98% |
| uniform random | median 8, mean 7.8 | median 7.5, mean 7.5 | n/a |

## FR: closest party pairs in the coded data

| pair | mean Likert gap | identical positions | shared statements |
|---|---|---|---|
| Renaissance / Horizons | 0.26 | 26/35 | 35 |
| Rassemblement National / Reconquête | 0.57 | 20/35 | 35 |
| Union Populaire Républicaine (UPR) / Les Patriotes | 0.60 | 18/35 | 35 |
| Les Écologistes / Parti Socialiste | 0.60 | 16/35 | 35 |
| La France Insoumise / Parti Communiste Français | 0.63 | 19/35 | 35 |
| Les Républicains / Horizons | 0.69 | 13/35 | 35 |
| Renaissance / MoDem | 0.71 | 13/35 | 35 |
| Parti Socialiste / MoDem | 0.74 | 15/35 | 35 |
| Rassemblement National / Les Patriotes | 0.77 | 15/35 | 35 |
| Reconquête / Les Républicains | 0.80 | 14/35 | 35 |
| Horizons / MoDem | 0.80 | 10/35 | 35 |
| Renaissance / Les Républicains | 0.89 | 12/35 | 35 |

## FR: pairs the answers cannot separate (7/300 respondents had a tie at all, 20% noise)

| pair | tied together |
|---|---|
| Reconquête / Rassemblement National | 3 |
| Horizons / Renaissance | 2 |
| La France Insoumise / Parti Communiste Français | 2 |
| MoDem / Parti Socialiste | 1 |
| Parti Socialiste / Renaissance | 1 |
| Horizons / Parti Socialiste | 1 |
| MoDem / Renaissance | 1 |
| Horizons / MoDem | 1 |

## FR: statements ranked by discriminating power (lowest first)

| statement | dimension | parties coded | sd | range | text |
|---|---|---|---|---|---|
| kn4 | knowledge | 12 | 0.83 | 2 | La liberté d'expression doit être très largement protégée, y compris p |
| kn1 | knowledge | 12 | 0.91 | 3 | Le consensus scientifique devrait peser davantage que l'opinion publiq |
| pw1 | power | 12 | 0.94 | 3 | L'État devrait jouer un rôle de planification dans les grandes orienta |
| ec3 | economy | 12 | 0.96 | 3 | Il faut protéger les industries nationales par des barrières commercia |
| kn3 | knowledge | 12 | 1.04 | 3 | L'expérience de terrain des citoyens devrait peser autant que l'expert |
| en3 | environment | 12 | 1.08 | 3 | L'innovation technologique permettra de répondre à l'essentiel du défi |
| ge4 | geopolitics | 12 | 1.09 | 3 | Le pays doit pouvoir intervenir militairement à l'étranger pour protég |
| so5_fr | social | 12 | 1.09 | 3 | La laïcité devrait être appliquée plus strictement, y compris dans l'e |
| mo3 | moral | 12 | 1.11 | 3 | La protection des plus vulnérables devrait être le premier critère de  |
| pw3_fr | power | 12 | 1.11 | 3 | Les régions et les communes devraient exercer davantage de compétences |
| pw2 | power | 12 | 1.19 | 3 | Les citoyens devraient pouvoir proposer ou abroger des lois par référe |
| ec2 | economy | 12 | 1.19 | 3 | Les services essentiels (énergie, transports, santé) devraient être pr |
| en4 | environment | 12 | 1.23 | 4 | La protection de l'environnement doit primer, même quand elle ralentit |
| so3 | social | 12 | 1.26 | 4 | Une intégration réussie suppose que les nouveaux arrivants adoptent la |
| mo2 | moral | 12 | 1.26 | 4 | L'efficacité d'une politique compte davantage que sa conformité à des  |
| kn2 | knowledge | 12 | 1.26 | 3 | Les grands médias d'information couvrent l'actualité de façon globalem |
| en2 | environment | 12 | 1.28 | 4 | Il faut accepter des contraintes sur certains modes de consommation (a |
| mo4 | moral | 12 | 1.32 | 4 | La fidélité à l'histoire et à l'identité du pays doit guider les choix |
| so2 | social | 12 | 1.32 | 4 | Des politiques actives de correction des inégalités entre groupes (quo |
| ec4 | economy | 12 | 1.35 | 4 | La réduction de la dette publique devrait être une priorité, même au p |
| mo1 | moral | 12 | 1.36 | 4 | En politique, il vaut mieux accepter des compromis que défendre des po |
| so1 | social | 12 | 1.38 | 4 | L'extension des droits individuels en matière sociétale (fin de vie as |
| pw4 | power | 12 | 1.40 | 4 | Pour garantir la sécurité, il est acceptable d'étendre les pouvoirs de |
| ge7 | geopolitics | 12 | 1.40 | 4 | Dans le conflit israélo-palestinien, mon pays doit soutenir en priorit |
| ge6 | geopolitics | 12 | 1.41 | 4 | À terme, mon pays devra renouer des relations économiques et diplomati |
| ge8_fr | geopolitics | 12 | 1.41 | 4 | La France devrait quitter l'Union européenne. |
| so4 | social | 12 | 1.42 | 4 | La consommation de cannabis devrait être légalisée et encadrée. |
| en1 | environment | 12 | 1.44 | 4 | L'énergie nucléaire doit faire partie de la réponse au défi climatique |
| ge3 | geopolitics | 12 | 1.44 | 4 | L'immigration est globalement une chance pour le pays. |
| ge1 | geopolitics | 12 | 1.46 | 4 | Mon pays devrait reprendre à l'Union européenne une partie des compéte |
| ge2 | geopolitics | 12 | 1.52 | 4 | L'appartenance à l'OTAN sert les intérêts de mon pays. |
| ec1 | economy | 12 | 1.53 | 4 | Il faut augmenter la contribution fiscale des plus hauts revenus et pa |
| ge5 | geopolitics | 12 | 1.70 | 4 | Mon pays doit poursuivre son soutien militaire à l'Ukraine, même si ce |
| ge9_fr | geopolitics | 12 | 1.71 | 4 | La France devrait quitter l'OTAN, et pas seulement son commandement in |
| ec5_fr | economy | 12 | 1.71 | 4 | L'âge légal de départ à la retraite devrait être ramené à 62 ans. |

0 of 35 statements have sd < 0.75, meaning the parties answer them nearly alike.

## BE: leading group size, 12 parties

| respondent | express (15) | complete (33) | leader is target |
|---|---|---|---|
| party + 0% noise | median 1, mean 1.2 | median 1, mean 1.2 | 92% |
| party + 10% noise | median 1, mean 1.4 | median 1, mean 1.2 | 92% |
| party + 20% noise | median 1, mean 1.9 | median 1, mean 1.2 | 92% |
| party + 30% noise | median 2, mean 2.5 | median 1, mean 1.5 | 91% |
| party + 50% noise | median 4, mean 4.4 | median 2, mean 2.8 | 81% |
| uniform random | median 7, mean 7.4 | median 8, mean 7.4 | n/a |

## BE: closest party pairs in the coded data

| pair | mean Likert gap | identical positions | shared statements |
|---|---|---|---|
| Ecolo / Groen | 0.00 | 33/33 | 33 |
| Mouvement Réformateur (MR) / Open VLD | 0.24 | 26/33 | 33 |
| Parti Socialiste (PS) / Vooruit | 0.45 | 22/33 | 33 |
| Les Engagés / CD&V | 0.48 | 20/33 | 33 |
| Parti Socialiste (PS) / Ecolo | 0.52 | 17/33 | 33 |
| Parti Socialiste (PS) / Groen | 0.52 | 17/33 | 33 |
| Les Engagés / DéFI | 0.52 | 18/33 | 33 |
| Mouvement Réformateur (MR) / N-VA | 0.55 | 18/33 | 33 |
| N-VA / Open VLD | 0.55 | 18/33 | 33 |
| Les Engagés / Vooruit | 0.58 | 18/33 | 33 |
| Parti Socialiste (PS) / Les Engagés | 0.67 | 16/33 | 33 |
| Vooruit / CD&V | 0.70 | 17/33 | 33 |

## BE: pairs the answers cannot separate (66/300 respondents had a tie at all, 20% noise)

| pair | tied together |
|---|---|
| Ecolo / Groen | 50 |
| Mouvement Réformateur (MR) / Open VLD | 7 |
| Parti Socialiste (PS) / Vooruit | 4 |
| Mouvement Réformateur (MR) / N-VA | 2 |
| Ecolo / Parti Socialiste (PS) | 2 |
| Groen / Parti Socialiste (PS) | 2 |
| CD&V / DéFI | 2 |
| DéFI / Les Engagés | 1 |
| Les Engagés / Vooruit | 1 |
| Ecolo / Vooruit | 1 |
| Groen / Vooruit | 1 |
| CD&V / Les Engagés | 1 |

## BE: statements ranked by discriminating power (lowest first)

| statement | dimension | parties coded | sd | range | text |
|---|---|---|---|---|---|
| ec3 | economy | 12 | 0.64 | 2 | Il faut protéger les industries nationales par des barrières commercia |
| ge6 | geopolitics | 12 | 0.75 | 2 | À terme, mon pays devra renouer des relations économiques et diplomati |
| kn3 | knowledge | 12 | 0.75 | 2 | L'expérience de terrain des citoyens devrait peser autant que l'expert |
| ge1 | geopolitics | 12 | 0.76 | 2 | Mon pays devrait reprendre à l'Union européenne une partie des compéte |
| kn1 | knowledge | 12 | 0.76 | 3 | Le consensus scientifique devrait peser davantage que l'opinion publiq |
| ge4 | geopolitics | 12 | 0.82 | 3 | Le pays doit pouvoir intervenir militairement à l'étranger pour protég |
| pw2 | power | 12 | 0.94 | 3 | Les citoyens devraient pouvoir proposer ou abroger des lois par référe |
| ge5 | geopolitics | 12 | 0.95 | 3 | Mon pays doit poursuivre son soutien militaire à l'Ukraine, même si ce |
| kn2 | knowledge | 12 | 1.01 | 3 | Les grands médias d'information couvrent l'actualité de façon globalem |
| so4 | social | 12 | 1.04 | 3 | La consommation de cannabis devrait être légalisée et encadrée. |
| kn4 | knowledge | 12 | 1.08 | 3 | La liberté d'expression doit être très largement protégée, y compris p |
| ge2 | geopolitics | 12 | 1.09 | 4 | L'appartenance à l'OTAN sert les intérêts de mon pays. |
| ec2 | economy | 12 | 1.11 | 3 | Les services essentiels (énergie, transports, santé) devraient être pr |
| ge3 | geopolitics | 12 | 1.11 | 4 | L'immigration est globalement une chance pour le pays. |
| mo1 | moral | 12 | 1.11 | 4 | En politique, il vaut mieux accepter des compromis que défendre des po |
| so1 | social | 12 | 1.15 | 3 | L'extension des droits individuels en matière sociétale (fin de vie as |
| ge7 | geopolitics | 12 | 1.16 | 4 | Dans le conflit israélo-palestinien, mon pays doit soutenir en priorit |
| pw1 | power | 12 | 1.19 | 4 | L'État devrait jouer un rôle de planification dans les grandes orienta |
| en4 | environment | 12 | 1.23 | 4 | La protection de l'environnement doit primer, même quand elle ralentit |
| so2 | social | 12 | 1.29 | 4 | Des politiques actives de correction des inégalités entre groupes (quo |
| ec4 | economy | 12 | 1.30 | 4 | La réduction de la dette publique devrait être une priorité, même au p |
| mo4 | moral | 12 | 1.30 | 4 | La fidélité à l'histoire et à l'identité du pays doit guider les choix |
| so3 | social | 12 | 1.32 | 4 | Une intégration réussie suppose que les nouveaux arrivants adoptent la |
| mo3 | moral | 12 | 1.34 | 3 | La protection des plus vulnérables devrait être le premier critère de  |
| en2 | environment | 12 | 1.38 | 4 | Il faut accepter des contraintes sur certains modes de consommation (a |
| en3 | environment | 12 | 1.41 | 4 | L'innovation technologique permettra de répondre à l'essentiel du défi |
| pw3_be | power | 12 | 1.43 | 4 | Davantage de compétences fédérales devraient être transférées aux Régi |
| en1 | environment | 12 | 1.44 | 4 | L'énergie nucléaire doit faire partie de la réponse au défi climatique |
| mo2 | moral | 12 | 1.44 | 4 | L'efficacité d'une politique compte davantage que sa conformité à des  |
| pw4 | power | 12 | 1.44 | 4 | Pour garantir la sécurité, il est acceptable d'étendre les pouvoirs de |
| so5_be | social | 12 | 1.49 | 4 | Les personnes sans titre de séjour présentes depuis plusieurs années d |
| ec1 | economy | 12 | 1.61 | 4 | Il faut augmenter la contribution fiscale des plus hauts revenus et pa |
| ec5_be | economy | 12 | 1.63 | 4 | Les allocations de chômage devraient être limitées dans le temps. |

3 of 33 statements have sd < 0.75, meaning the parties answer them nearly alike.
