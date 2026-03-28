# Registre des usages de l'IA

Journal des usages substantiels de modèles d'IA dans le projet.
Format: date, modèle, tâche, prompt utilisé, statut de validation humaine.

---

## 2026-06 - Constitution du jeu de données initial

- **Modèle**: Claude Opus 4.8 (Anthropic), via Claude Code.
- **Tâches**:
  - Codage préliminaire des 448 positions de partis (16 partis x 28 énoncés),
    d'après les programmes et prises de position publiques.
    Statut: "a_verifier" sur la totalité, affiché dans le produit.
    Validation humaine: relecture équipe en cours; double codage
    contradictoire planifié (voir gouvernance du projet).
  - Rédaction des 10 fiches de faisabilité juridique initiales.
    Statut: "préliminaire", affiché dans le produit.
    Validation humaine: validation par juristes extérieurs planifiée.
  - Rédaction initiale des 28 énoncés et des signatures de courants de pensée.
    Validation humaine: audit multi-bords planifié.
  - Développement de l'application (code, sans contenu éditorial autonome).
- **Prompts**: les prompts publiés dans ce dépôt (dossier prompts/) sont les
  versions de référence pour la maintenance de ces données; le jeu initial a
  été produit de manière conversationnelle selon les mêmes règles, avant
  formalisation des prompts. C'est une limite de traçabilité du démarrage,
  assumée et corrigée pour la suite: tout nouvel usage passe par les prompts
  publiés.

---

## 2026-06-07 - Fusion "Le Crible Politique"

- **Modèle**: Claude Opus 4.8 (Anthropic), via Claude Code.
- **Tâches**: fusion des deux prototypes (ingénierie: portage du moteur
  déterministe et des données, nouveau parcours de test, observatoire,
  partage). Aucune nouvelle donnée éditoriale créée; les corpus existants
  (28 énoncés, 672 positions, 14 fiches) conservent leurs statuts
  "préliminaire / à vérifier". Suppressions doctrinales consignées dans
  CHANGELOG-DONNEES.md (verdicts de faisabilité, matrices d'impact).
- **Validation humaine**: relecture du porteur de projet; les validations
  de fond (double codage, juristes) restent planifiées (gouvernance).

(Prochaines entrées: chaque usage substantiel, avec modèle et version.)
