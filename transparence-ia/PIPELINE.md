# Pipeline: de l'IA à la publication

Circuit complet d'une donnée éditoriale, avec les points de contrôle humain.
Aucune étape ne peut être sautée.

## A. Positions de partis

```
1. BROUILLON IA
   Prompt 01, programme officiel du parti en entrée.
   Sortie: position (-2..+2) + source citée + justification courte.
   Statut automatique: "a_verifier".
        |
2. RELECTURE ÉQUIPE
   Vérification de la source (existe, dit bien cela, datée).
   La position reste "a_verifier" (le statut est affiché aux utilisateurs).
        |
3. DOUBLE CODAGE CONTRADICTOIRE (feuille de route)
   Deux relecteurs humains de sensibilités politiques différentes codent
   indépendamment. Accord -> statut "verifie". Désaccord -> discussion
   documentée, arbitrage, ou statut "non_documente" si indécidable.
        |
4. AUTO-POSITIONNEMENT DU PARTI (feuille de route)
   Le parti est invité à se positionner lui-même. Écart avec notre codage ->
   affichage des deux positions avec justifications.
        |
5. PUBLICATION + JOURNAL
   Toute modification est consignée (date, ancienne valeur, nouvelle valeur,
   motif, source) dans le journal public des modifications.
```

## B. Fiches de faisabilité juridique

```
1. BROUILLON IA (prompt 02, structure imposée, verdicts interdits)
   Statut: "préliminaire", affiché dans le produit.
        |
2. RELECTURE ÉQUIPE (cohérence, sources, séparation établi/débattu)
        |
3. VALIDATION JURISTES EXTÉRIEURS (feuille de route)
   Deux juristes indépendants, spécialité appariée à la mesure.
   Grille: erreurs factuelles / obstacles manquants / points "établis"
   contestables / voies manquantes / niveau d'incertitude.
   Désaccord entre relecteurs -> le point bascule en "débattu" avec les
   deux lectures.
        |
4. CONTRADICTOIRE (optionnel mais recommandé)
   La fiche est envoyée au parti qui porte la mesure, avec délai de réponse.
   La réponse (ou son absence) est mentionnée.
        |
5. PUBLICATION
   Mention "Relu par [nom, qualité, date]" sur la fiche validée.
```

## C. Énoncés du questionnaire

```
1. RÉDACTION (humaine ou assistée) selon les 3 règles publiées:
   une proposition par énoncé, vocabulaire neutre, équilibre des polarités.
        |
2. AUDIT IA DE NEUTRALITÉ (prompt 03, au moins deux modèles différents)
        |
3. AUDIT HUMAIN MULTI-BORDS (feuille de route)
   Chaque relecteur doit pouvoir lire chaque énoncé "sans gêne".
        |
4. PUBLICATION + JOURNAL (tout changement d'énoncé est tracé)
```

## D. Red team permanent

Avant chaque lancement public et à chaque évolution significative:
prompt 05 exécuté depuis chaque sensibilité politique, puis red team humain.
Critère de réussite: critiques symétriques ou absentes. Une critique
unilatérale signale un biais réel à corriger, pas un adversaire à réfuter.
