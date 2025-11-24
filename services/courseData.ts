import { Capsule, SubjectGroup } from '../types';

// This is where you will add your video URLs.
// I have populated it with your CSV data.

const rawData = [
  { 
    id: 1, 
    title: "Introduction à la cellule et ses types (procaryotes/eucaryotes)", 
    subject: "Biologie", 
    theme: "Biologie cellulaire et moléculaire",
    videoUrl: "https://www.youtube.com/embed/XVvUyPkC3kc?si=WYVA-lRSZVLwtbr6" // Updated to full Embed URL
  },
  { id: 2, title: "La membrane plasmique : structure et rôle", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 3, title: "Les organites : mitochondries et production d’énergie", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 4, title: "Noyau et organisation de l’ADN", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 5, title: "Le cytosquelette : microtubules, microfilaments, filaments intermédiaires", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 6, title: "Transport membranaire : diffusion, osmose, transport actif", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 7, title: "Communication cellulaire : récepteurs et signaux", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 8, title: "Le cycle cellulaire : phases G1, S, G2, M", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 9, title: "Mitose et régulation", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 10, title: "Méiose et diversité génétique", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 11, title: "Réplication de l’ADN", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 12, title: "Transcription et ARN", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 13, title: "Traduction et synthèse des protéines", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 14, title: "Régulation de l’expression des gènes", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 15, title: "Mutations et réparation de l’ADN", subject: "Biologie", theme: "Biologie cellulaire et moléculaire" },
  { id: 16, title: "Introduction à l’anatomie et terminologie", subject: "Biologie", theme: "Anatomie" },
  { id: 17, title: "Le squelette axial (crâne, colonne vertébrale, cage thoracique)", subject: "Biologie", theme: "Anatomie" },
  { id: 18, title: "Le squelette appendiculaire (membres supérieurs)", subject: "Biologie", theme: "Anatomie" },
  { id: 19, title: "Le squelette appendiculaire (membres inférieurs)", subject: "Biologie", theme: "Anatomie" },
  { id: 20, title: "Articulations et mouvements de base", subject: "Biologie", theme: "Anatomie" },
  { id: 21, title: "Muscles du tronc et des membres", subject: "Biologie", theme: "Anatomie" },
  { id: 22, title: "Muscles du système locomoteur : focus pratique", subject: "Biologie", theme: "Anatomie" },
  { id: 23, title: "Système nerveux central : cerveau", subject: "Biologie", theme: "Anatomie" },
  { id: 24, title: "Système nerveux périphérique", subject: "Biologie", theme: "Anatomie" },
  { id: 25, title: "Moelle épinière et voies nerveuses", subject: "Biologie", theme: "Anatomie" },
  { id: 26, title: "Anatomie de l’appareil respiratoire", subject: "Biologie", theme: "Anatomie" },
  { id: 27, title: "Anatomie de l’appareil cardiovasculaire", subject: "Biologie", theme: "Anatomie" },
  { id: 28, title: "Anatomie de l’appareil digestif", subject: "Biologie", theme: "Anatomie" },
  { id: 29, title: "Anatomie de l’appareil urinaire", subject: "Biologie", theme: "Anatomie" },
  { id: 30, title: "Anatomie du système reproducteur", subject: "Biologie", theme: "Anatomie" },
  { id: 31, title: "Introduction à la physiologie humaine", subject: "Biologie", theme: "Physiologie" },
  { id: 32, title: "Homéostasie et régulation", subject: "Biologie", theme: "Physiologie" },
  { id: 33, title: "Physiologie de la respiration : ventilation et échanges gazeux", subject: "Biologie", theme: "Physiologie" },
  { id: 34, title: "Régulation de la respiration", subject: "Biologie", theme: "Physiologie" },
  { id: 35, title: "Circulation sanguine : cœur et vaisseaux", subject: "Biologie", theme: "Physiologie" },
  { id: 36, title: "Régulation de la pression artérielle", subject: "Biologie", theme: "Physiologie" },
  { id: 37, title: "Physiologie du sang (composition, rôle des cellules sanguines)", subject: "Biologie", theme: "Physiologie" },
  { id: 38, title: "Physiologie de la digestion : de la bouche à l’intestin", subject: "Biologie", theme: "Physiologie" },
  { id: 39, title: "Absorption des nutriments", subject: "Biologie", theme: "Physiologie" },
  { id: 40, title: "Fonction du foie et du pancréas", subject: "Biologie", theme: "Physiologie" },
  { id: 41, title: "Physiologie du rein et filtration glomérulaire", subject: "Biologie", theme: "Physiologie" },
  { id: 42, title: "Régulation de l’eau et des électrolytes", subject: "Biologie", theme: "Physiologie" },
  { id: 43, title: "Physiologie hormonale : glandes endocrines", subject: "Biologie", theme: "Physiologie" },
  { id: 44, title: "Hormones et régulation métabolique", subject: "Biologie", theme: "Physiologie" },
  { id: 45, title: "Physiologie de la reproduction (cycle, fécondation, grossesse)", subject: "Biologie", theme: "Physiologie" },
  { id: 46, title: "Introduction à la chimie générale", subject: "Chimie", theme: "Chimie générale" },
  { id: 47, title: "Structure de l’atome et configuration électronique", subject: "Chimie", theme: "Chimie générale" },
  { id: 48, title: "Tableau périodique et propriétés périodiques", subject: "Chimie", theme: "Chimie générale" },
  { id: 49, title: "Les liaisons chimiques (ioniques, covalentes, métalliques)", subject: "Chimie", theme: "Chimie générale" },
  { id: 50, title: "Forces intermoléculaires : Van der Waals, liaisons hydrogène", subject: "Chimie", theme: "Chimie générale" },
  { id: 51, title: "Thermodynamique chimique : énergie, enthalpie, entropie", subject: "Chimie", theme: "Chimie générale" },
  { id: 52, title: "Cinétique chimique : vitesse et mécanismes de réaction", subject: "Chimie", theme: "Chimie générale" },
  { id: 53, title: "Équilibres chimiques (constantes, principe de Le Chatelier)", subject: "Chimie", theme: "Chimie générale" },
  { id: 54, title: "Réactions acido-basiques (pH, tampons, équilibres)", subject: "Chimie", theme: "Chimie générale" },
  { id: 55, title: "Introduction à la chimie organique", subject: "Chimie", theme: "Chimie organique" },
  { id: 56, title: "Les alcanes et leurs propriétés", subject: "Chimie", theme: "Chimie organique" },
  { id: 57, title: "Alcènes et alcynes : réactivité et isomérie", subject: "Chimie", theme: "Chimie organique" },
  { id: 58, title: "Les fonctions oxygénées : alcools, phénols, éthers", subject: "Chimie", theme: "Chimie organique" },
  { id: 59, title: "Aldéhydes et cétones", subject: "Chimie", theme: "Chimie organique" },
  { id: 60, title: "Acides carboxyliques et dérivés", subject: "Chimie", theme: "Chimie organique" },
  { id: 61, title: "Les amines et leurs propriétés", subject: "Chimie", theme: "Chimie organique" },
  { id: 62, title: "Réactions de substitution, addition et élimination (vue d’ensemble)", subject: "Chimie", theme: "Chimie organique" },
  { id: 63, title: "Introduction à la biochimie", subject: "Chimie", theme: "Biochimie" },
  { id: 64, title: "Glucides : structure et rôle", subject: "Chimie", theme: "Biochimie" },
  { id: 65, title: "Lipides : classification et fonctions biologiques", subject: "Chimie", theme: "Biochimie" },
  { id: 66, title: "Acides aminés et protéines (structure primaire à quaternaire)", subject: "Chimie", theme: "Biochimie" },
  { id: 67, title: "Enzymes : mécanismes et cinétique enzymatique", subject: "Chimie", theme: "Biochimie" },
  { id: 68, title: "Métabolisme énergétique : glycolyse et cycle de Krebs", subject: "Chimie", theme: "Biochimie" },
  { id: 69, title: "Phosphorylation oxydative et chaîne respiratoire", subject: "Chimie", theme: "Biochimie" },
  { id: 70, title: "Bases azotées et acides nucléiques (ADN/ARN, synthèse et rôle)", subject: "Chimie", theme: "Biochimie" },
  { id: 71, title: "Introduction à la biophysique et lien avec la médecine", subject: "Biophysique", theme: "Mécanique" },
  { id: 72, title: "Les forces et la 1ère loi de Newton", subject: "Biophysique", theme: "Mécanique" },
  { id: 73, title: "Travail et énergie mécanique", subject: "Biophysique", theme: "Mécanique" },
  { id: 74, title: "Quantité de mouvement et impulsion", subject: "Biophysique", theme: "Mécanique" },
  { id: 75, title: "Lois de la statique et de l’équilibre", subject: "Biophysique", theme: "Mécanique" },
  { id: 76, title: "Applications médicales de la mécanique", subject: "Biophysique", theme: "Mécanique" },
  { id: 77, title: "Charges, courant et tension", subject: "Biophysique", theme: "Électricité" },
  { id: 78, title: "Loi d’Ohm et résistances", subject: "Biophysique", theme: "Électricité" },
  { id: 79, title: "Circuits en série et parallèle", subject: "Biophysique", theme: "Électricité" },
  { id: 80, title: "Condensateurs et capacités", subject: "Biophysique", theme: "Électricité" },
  { id: 81, title: "Courant alternatif et impédance", subject: "Biophysique", theme: "Électricité" },
  { id: 82, title: "Applications médicales : ECG, défibrillateur", subject: "Biophysique", theme: "Électricité" },
  { id: 83, title: "Lumière et lois de Snell-Descartes", subject: "Biophysique", theme: "Optique" },
  { id: 84, title: "Lentilles minces : images réelles et virtuelles", subject: "Biophysique", theme: "Optique" },
  { id: 85, title: "Instruments optiques : microscope et loupe", subject: "Biophysique", theme: "Optique" },
  { id: 86, title: "Défauts de l’œil : myopie, hypermétropie, astigmatisme", subject: "Biophysique", theme: "Optique" },
  { id: 87, title: "Applications médicales : lunettes, lasers ophtalmo", subject: "Biophysique", theme: "Optique" },
  { id: 88, title: "Notion d’onde et équation fondamentale", subject: "Biophysique", theme: "Ondes et acoustique" },
  { id: 89, title: "Ondes mécaniques : propagation et interférences", subject: "Biophysique", theme: "Ondes et acoustique" },
  { id: 90, title: "Ondes sonores et intensité acoustique", subject: "Biophysique", theme: "Ondes et acoustique" },
  { id: 91, title: "Décibels et seuils auditifs", subject: "Biophysique", theme: "Ondes et acoustique" },
  { id: 92, title: "Applications médicales : ultrasons, échographie", subject: "Biophysique", theme: "Ondes et acoustique" },
  { id: 93, title: "Nature des rayonnements (alpha, bêta, gamma)", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 94, title: "Radioactivité : lois de décroissance", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 95, title: "Interaction rayonnements/matière", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 96, title: "Protection contre les rayonnements ionisants", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 97, title: "Principes de la radiographie et du scanner", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 98, title: "IRM : principes physiques", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 99, title: "Médecine nucléaire : scintigraphie, PET-scan", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 100, title: "Radiothérapie et applications thérapeutiques", subject: "Biophysique", theme: "Rayonnements et imagerie médicale" },
  { id: 101, title: "Comment organiser son année de terminale pour la PASS", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 102, title: "Créer un planning réaliste et efficace", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 103, title: "Gérer les priorités et éviter la procrastination", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 104, title: "L’équilibre travail/repos : comment tenir sur la durée", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 105, title: "Les meilleures méthodes de prise de notes", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 106, title: "Créer des fiches de révision claires et utiles", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 107, title: "Utiliser les outils numériques (Anki, Notion, Quizlet)", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 108, title: "La répétition espacée et les flashcards", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 109, title: "Les techniques de mémorisation actives", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 110, title: "Comment retenir les schémas, formules et listes complexes", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 111, title: "Gérer le stress et rester motivé(e)", subject: "Méthodologie", theme: "Organisation et apprentissage" },
  { id: 112, title: "Cultiver un état d’esprit gagnant en PASS", subject: "Méthodologie", theme: "Organisation et apprentissage" }
];

export const getCourseData = (): SubjectGroup[] => {
  const subjects: { [key: string]: { [key: string]: Capsule[] } } = {};

  rawData.forEach(item => {
    if (!subjects[item.subject]) {
      subjects[item.subject] = {};
    }
    if (!subjects[item.subject][item.theme]) {
      subjects[item.subject][item.theme] = [];
    }
    
    // Pass the item directly, including videoUrl if it exists
    subjects[item.subject][item.theme].push(item);
  });

  return Object.keys(subjects).map(subjectName => ({
    name: subjectName,
    themes: Object.keys(subjects[subjectName]).map(themeName => ({
      name: themeName,
      capsules: subjects[subjectName][themeName]
    }))
  }));
};

export const getAllCapsules = (): Capsule[] => {
    return rawData;
}