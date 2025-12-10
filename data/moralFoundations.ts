// Moral Foundations Questionnaire (Haidt, MFT): 2 items per foundation,
// adapted from the Moral Foundations Questionnaire. The only product module
// that uses this block; it is isolated here so as not to ship a larger
// questionnaire in the module's client bundle.

export interface MoralFoundationQuestion {
    id: string;
    foundation: 'care' | 'fairness' | 'loyalty' | 'authority' | 'sanctity' | 'liberty';
    text: string;
}

export const MORAL_FOUNDATION_QUESTIONS: MoralFoundationQuestion[] = [
    { id: 'mf1', foundation: 'care', text: "La compassion pour ceux qui souffrent est la vertu la plus importante" },
    { id: 'mf2', foundation: 'care', text: "Une société se juge d'abord à la manière dont elle traite ses membres les plus vulnérables" },
    { id: 'mf3', foundation: 'fairness', text: "La justice exige que chacun soit traité de manière égale, quels que soient ses origines ou son statut" },
    { id: 'mf4', foundation: 'fairness', text: "Les gens qui travaillent dur méritent de gagner plus que ceux qui fournissent moins d'efforts" },
    { id: 'mf5', foundation: 'loyalty', text: "La loyauté envers son pays est une qualité importante, même quand il a des défauts" },
    { id: 'mf6', foundation: 'loyalty', text: "Il est important de soutenir les membres de son groupe ou de sa communauté avant les autres" },
    { id: 'mf7', foundation: 'authority', text: "Le respect de l'autorité et des traditions est important pour le bon fonctionnement de la société" },
    { id: 'mf8', foundation: 'authority', text: "Les enfants doivent apprendre à respecter les règles et les figures d'autorité" },
    { id: 'mf9', foundation: 'sanctity', text: "Certaines choses sont sacrées et ne devraient pas être remises en question au nom du progrès" },
    { id: 'mf10', foundation: 'sanctity', text: "La dignité humaine impose des limites morales que ni la science ni le marché ne devraient franchir" },
    { id: 'mf11', foundation: 'liberty', text: "L'État ne devrait pas interférer dans les choix de vie privée des citoyens" },
    { id: 'mf12', foundation: 'liberty', text: "La concentration du pouvoir, qu'il soit politique ou économique, est toujours dangereuse" }
];
