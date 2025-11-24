import { QuizData } from '../types';

export const quizzes: QuizData[] = [
  {
    capsuleId: 1, // Introduction à la cellule
    questions: [
      {
        id: 1,
        question: "Quelle métaphore est utilisée dans le cours pour décrire le fonctionnement global d'une cellule ?",
        options: [
          { id: 1, text: "Une bibliothèque géante", isCorrect: false },
          { id: 2, text: "Une petite usine autonome", isCorrect: true },
          { id: 3, text: "Un réseau informatique", isCorrect: false },
          { id: 4, text: "Une ruche d'abeilles", isCorrect: false },
        ],
        explanation: "La cellule fabrique, consomme, échange et s'adapte, tout comme une usine."
      },
      {
        id: 2,
        question: "Quelle est la fonction principale de la membrane plasmique ?",
        options: [
          { id: 1, text: "Produire de l'énergie", isCorrect: false },
          { id: 2, text: "Stocker l'ADN", isCorrect: false },
          { id: 3, text: "Agir comme une frontière sélective", isCorrect: true },
          { id: 4, text: "Fabriquer des protéines", isCorrect: false },
        ],
        explanation: "Elle laisse passer certaines molécules et en bloque d'autres."
      },
      {
        id: 3,
        question: "Que signifie étymologiquement le terme 'Procaryote' ?",
        options: [
          { id: 1, text: "Vrai noyau", isCorrect: false },
          { id: 2, text: "Avant le noyau", isCorrect: true },
          { id: 3, text: "Sans membrane", isCorrect: false },
          { id: 4, text: "Cellule ancienne", isCorrect: false },
        ],
        explanation: "'Pro' signifie avant et 'karyon' signifie noyau."
      },
      {
        id: 4,
        question: "Où se situe le matériel génétique (ADN) chez les procaryotes ?",
        options: [
          { id: 1, text: "Dans le noyau", isCorrect: false },
          { id: 2, text: "Dans les mitochondries", isCorrect: false },
          { id: 3, text: "Flottant librement dans le nucléoïde", isCorrect: true },
          { id: 4, text: "Dans le réticulum endoplasmique", isCorrect: false },
        ],
        explanation: "Les procaryotes n'ont pas de noyau délimité par une membrane."
      },
      {
        id: 5,
        question: "Quelle molécule spécifique compose la paroi des bactéries (absente chez l'homme) ?",
        options: [
          { id: 1, text: "La cellulose", isCorrect: false },
          { id: 2, text: "Le cholestérol", isCorrect: false },
          { id: 3, text: "Les peptidoglycanes", isCorrect: true },
          { id: 4, text: "La kératine", isCorrect: false },
        ],
        explanation: "C'est cette différence qui permet à certains antibiotiques de cibler les bactéries sans toucher nos cellules."
      },
      {
        id: 6,
        question: "Quelle est la caractéristique principale des Archées mentionnée dans le cours ?",
        options: [
          { id: 1, text: "Elles causent la plupart des maladies humaines", isCorrect: false },
          { id: 2, text: "Elles vivent dans des milieux extrêmes", isCorrect: true },
          { id: 3, text: "Elles possèdent un noyau", isCorrect: false },
          { id: 4, text: "Elles sont pluricellulaires", isCorrect: false },
        ],
        explanation: "On les trouve dans les volcans ou les lacs très salés."
      },
      {
        id: 7,
        question: "Quel organite est responsable de la production d'énergie chez les eucaryotes ?",
        options: [
          { id: 1, text: "L'appareil de Golgi", isCorrect: false },
          { id: 2, text: "Le lysosome", isCorrect: false },
          { id: 3, text: "La mitochondrie", isCorrect: true },
          { id: 4, text: "Le ribosome", isCorrect: false },
        ],
        explanation: "La mitochondrie est la centrale énergétique de la cellule eucaryote."
      },
      {
        id: 8,
        question: "Selon la théorie endosymbiotique, quelle est l'origine des mitochondries ?",
        options: [
          { id: 1, text: "Une invagination de la membrane", isCorrect: false },
          { id: 2, text: "Une bactérie primitive avalée par une autre cellule", isCorrect: true },
          { id: 3, text: "Une mutation de l'ADN", isCorrect: false },
          { id: 4, text: "Un virus intégré", isCorrect: false },
        ],
        explanation: "Il s'agirait d'une ancienne bactérie capable de produire de l'énergie, intégrée par symbiose."
      },
      {
        id: 9,
        question: "Quelle structure trouve-t-on chez la cellule végétale mais PAS chez la cellule animale ?",
        options: [
          { id: 1, text: "La membrane plasmique", isCorrect: false },
          { id: 2, text: "Le noyau", isCorrect: false },
          { id: 3, text: "La paroi cellulosique", isCorrect: true },
          { id: 4, text: "Les mitochondries", isCorrect: false },
        ],
        explanation: "Les végétaux ont une paroi rigide et des chloroplastes, contrairement aux animaux."
      },
      {
        id: 10,
        question: "Pourquoi les antibiotiques n'affectent-ils généralement pas les cellules humaines ?",
        options: [
          { id: 1, text: "Parce que les cellules humaines sont trop grosses", isCorrect: false },
          { id: 2, text: "Parce qu'ils ciblent des mécanismes spécifiques aux bactéries", isCorrect: true },
          { id: 3, text: "Parce que le système immunitaire les détruit", isCorrect: false },
          { id: 4, text: "Parce que les humains ont une paroi protectrice", isCorrect: false },
        ],
        explanation: "Ils visent par exemple la synthèse de la paroi bactérienne ou leurs ribosomes spécifiques."
      }
    ]
  }
];

export const getQuizByCapsuleId = (id: number): QuizData | undefined => {
  return quizzes.find(q => q.capsuleId === id);
};