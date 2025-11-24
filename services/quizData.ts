import { QuizData } from '../types';

// C'est ici que vous ajouterez vos QCM.
// Pour l'instant, j'ai créé le QCM pour la Capsule 1.

export const quizzes: QuizData[] = [
  {
    capsuleId: 1, // Introduction à la cellule
    questions: [
      {
        id: 1,
        question: "Quelle est la différence fondamentale entre une cellule procaryote et une cellule eucaryote ?",
        options: [
          { id: 1, text: "Les procaryotes ont une paroi cellulaire, pas les eucaryotes.", isCorrect: false },
          { id: 2, text: "Les eucaryotes possèdent un vrai noyau délimité par une enveloppe nucléaire, contrairement aux procaryotes.", isCorrect: true },
          { id: 3, text: "Les procaryotes sont toujours pluricellulaires.", isCorrect: false },
          { id: 4, text: "Les eucaryotes n'ont pas d'ADN.", isCorrect: false },
        ],
        explanation: "C'est la définition même ! 'Eu-caryote' signifie 'vrai noyau'. Les procaryotes (bactéries, archées) ont leur matériel génétique libre dans le cytoplasme (nucléoïde)."
      },
      {
        id: 2,
        question: "Concernant les organites, lequel de ces énoncés est correct ?",
        options: [
          { id: 1, text: "Les procaryotes possèdent de nombreuses mitochondries.", isCorrect: false },
          { id: 2, text: "Les ribosomes sont présents chez les procaryotes et les eucaryotes.", isCorrect: true },
          { id: 3, text: "Le réticulum endoplasmique est présent chez les bactéries.", isCorrect: false },
          { id: 4, text: "Les procaryotes ont des chloroplastes.", isCorrect: false },
        ],
        explanation: "Les ribosomes (nécessaires à la synthèse des protéines) sont les seuls 'organites' (bien que non membranaires) communs aux deux types. Les organites membranaires (mitochondries, RE, Golgi) sont spécifiques aux eucaryotes."
      },
      {
        id: 3,
        question: "Quel organisme est un procaryote ?",
        options: [
          { id: 1, text: "Une levure (champignon unicellulaire)", isCorrect: false },
          { id: 2, text: "Une cellule musculaire humaine", isCorrect: false },
          { id: 3, text: "Escherichia coli (bactérie)", isCorrect: true },
          { id: 4, text: "Une cellule végétale", isCorrect: false },
        ],
        explanation: "Les bactéries comme E. coli sont des procaryotes. Les levures, les plantes et les animaux (humains) sont des eucaryotes."
      }
    ]
  }
];

export const getQuizByCapsuleId = (id: number): QuizData | undefined => {
  return quizzes.find(q => q.capsuleId === id);
};