# Journal public des modifications de données

Ce journal consigne toute modification des éléments qui déterminent les
résultats de l'outil: énoncés, positions de partis, signatures de courants,
fiches de faisabilité, formule de calcul. C'est la contrepartie publique du
choix de ne pas ouvrir le code source: ce qui détermine les résultats est
public, daté et motivé.

Format de chaque entrée: date, élément modifié, ancienne valeur, nouvelle
valeur, motif, source.

---

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
