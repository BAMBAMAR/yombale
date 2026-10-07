function extraireTexteAReformuler(requete) {
  let texte = requete
    .replace(/^.*?\b(reformule[rz]?|am[ée]liore[rz]?|corrige[rz]?|r[ée][ée]cris?|r[ée]dige|peux[- ]tu reformuler)\s*(?:ce\s+texte|ceci|le\s+message|cette\s+phrase|ces\s+mots)?\s*[:\-]?\s*/i, '')
    .trim();

  texte = texte.replace(/^["'«\s]+|["'»\s]+$/g, '').trim();
  return texte || requete;
}

function genererReformulationsIntelligentes(texteSource) {
  const tLower = texteSource.toLowerCase();

  // THÈME 1 : DÉPART / QUITTER UN SERVICE OU POSTE / ADIEU
  if (/quitte|quitter|partir|d[ée]part|d[ée]mission|fin de mission|au revoir/i.test(tLower)) {
    const avecTristesse = /tristesse|regret|peine|cœur lourd|coeur lourd|émotion|emotion|regrette|triste/i.test(tLower);
    const serviceNom = /service/i.test(tLower) ? 'ce service' : /équipe|equipe/i.test(tLower) ? 'cette équipe' : /entreprise|société|societe/i.test(tLower) ? 'l\'entreprise' : 'cette structure';

    if (avecTristesse) {
      return {
        v1: `C'est avec beaucoup d'émotion et un profond regret que je vous informe de mon départ de ${serviceNom}. Je tiens à saluer l'engagement de chacun, à remercier chaleureusement la direction et mes collègues pour la richesse de nos collaborations, et je reste à votre entière disposition pour assurer une transition harmonieuse.`,
        v2: `C'est le cœur serré et avec une sincère tristesse que je quitte aujourd'hui notre service. Je garde un souvenir précieux de nos échanges, de l'esprit d'équipe et de la Teranga partagée au quotidien. Merci du fond du cœur à tous pour cette belle aventure humaine et professionnelle. Dal leen ak jamm !`,
        v3: `C'est avec regret que je vous annonce mon départ de ${serviceNom}. Je remercie toute l'équipe pour le travail accompli ensemble et vous souhaite une excellente suite professionnelle.`
      };
    }

    return {
      v1: `Je vous informe par la présente de mon départ prochain de ${serviceNom}. Je tiens à vous exprimer toute ma gratitude pour les opportunités et les synergies développées au sein de notre équipe.`,
      v2: `Une page se tourne pour moi : je quitte bientôt notre équipe. Je tenais à vous remercier chaleureusement pour votre accueil, votre soutien et ces moments partagés tout au long de mon parcours parmi vous.`,
      v3: `Je vous annonce mon départ prochain de ${serviceNom}. Merci à tous pour votre collaboration et bonne continuation dans la réalisation de vos projets.`
    };
  }

  // THÈME 2 : ABSENCE / RETARD / EMPÊCHEMENT
  if (/absent|absence|retard|pas venir|pas l[àa]|emp[êe]ch[ée]|pas disponible|indisponible|malade|impr[ée]vu/i.test(tLower)) {
    return {
      v1: `Je vous prie de bien vouloir excuser mon indisponibilité. En raison d'un contretemps indépendant de ma volonté, je ne serai pas en mesure d'être présent comme prévu. Je reste à votre disposition pour reprogrammer cet échange dès que possible.`,
      v2: `Bonjour, j'espère que vous vous portez bien. Je suis sincèrement désolé(e), mais j'ai un empêchement de dernière minute et je ne pourrai pas vous rejoindre à l'heure convenue. Je vous recontacte très rapidement pour convenir d'un nouveau créneau !`,
      v3: `Bonjour, je serai malheureusement absent(e) suite à un imprévu. Je reviens vers vous sans délai avec des disponibilités alternatives. Merci pour votre compréhension.`
    };
  }

  // THÈME 3 : RELANCE / ATTENTE DE RÉPONSE / SUIVI DE DOSSIER
  if (/relance|nouvelle|r[ée]ponse|attente|urgent|dossier|point|retour|avancement/i.test(tLower)) {
    return {
      v1: `Je me permets de revenir vers vous afin de solliciter une mise à jour concernant l'avancement de ce dossier. Votre retour nous serait particulièrement précieux afin de finaliser nos démarches dans les meilleurs délais.`,
      v2: `Bonjour, j'espère que votre semaine se passe au mieux. Je viens gentiment aux nouvelles concernant les éléments transmis précédemment. N'hésitez pas à me faire signe si vous avez besoin d'éclaircissements. Au plaisir d'échanger avec vous !`,
      v3: `Bonjour. Je me permets de relancer notre dernier échange. Avez-vous pu prendre connaissance des éléments ? Merci d'avance pour votre confirmation.`
    };
  }

  // THÈME 4 : REMERCIEMENT / GRATITUDE
  if (/merci|remercie|reconnaissant|gratitude|aide|soutien|gentillesse/i.test(tLower)) {
    return {
      v1: `Je tiens à vous adresser mes plus vifs remerciements pour la qualité de votre accompagnement et votre disponibilité sans faille dans le cadre de cette collaboration.`,
      v2: `Un très grand merci pour votre aide précieuse et votre bienveillance ! Votre soutien a fait toute la différence et c'est un réel plaisir de collaborer avec vous au quotidien.`,
      v3: `Merci beaucoup pour votre réactivité et votre appui efficace sur ce sujet. Bien cordialement.`
    };
  }

  // THÈME 5 : EXCUSE / PARDON / ERREUR
  if (/d[ée]sol[ée]|excuse|pardon|erreur|tromp[ée]|oubli/i.test(tLower)) {
    return {
      v1: `Je vous prie d'accepter mes excuses les plus sincères pour ce désagrément regrettable. Toutes les dispositions nécessaires ont été prises sans délai afin de rectifier la situation.`,
      v2: `Je suis sincèrement navré(e) pour ce contretemps et je vous présente toutes mes excuses. Merci beaucoup pour votre patience et votre compréhension bienveillante.`,
      v3: `Veuillez m'excuser pour cette erreur. La correction a été effectuée immédiatement. Merci pour votre compréhension.`
    };
  }

  // THÈME 6 : FÉLICITATIONS / SUCCÈS
  if (/f[ée]licit|bravo|succ[èe]s|r[ée]ussite|chapeau|victoire|promu/i.test(tLower)) {
    return {
      v1: `Je tiens à vous adresser mes plus sincères félicitations pour cette remarquable réussite. C'est le juste couronnement de votre investissement constant et de votre rigueur exemplaire.`,
      v2: `Toutes mes félicitations ! C'est une magnifique nouvelle qui récompense tout votre travail et votre talent. Très heureux/se pour vous et plein succès pour la suite !`,
      v3: `Bravo pour ce succès pleinement mérité. Félicitations et excellente continuation dans cette nouvelle étape.`
    };
  }

  // THÈME 7 : DEMANDE / NÉGOCIATION / BUDGET
  if (/augmentation|salaire|prix|budget|trop cher|co[ûu]t|n[ée]goc/i.test(tLower)) {
    return {
      v1: `Au regard des résultats obtenus et des exigences de notre mission, je souhaiterais solliciter un entretien afin d'échanger sur un ajustement financier en adéquation avec nos réalisations.`,
      v2: `Bonjour, au vu du travail accompli et de notre bel engagement ces derniers mois, j'aimerais qu'on prenne un moment pour discuter sereinement d'une revalorisation de nos conditions.`,
      v3: `Bonjour, je souhaiterais convenir d'un rendez-vous afin de faire le point sur mes performances et aborder la question d'un réajustement salarial.`
    };
  }

  // THÈME UNIVERSEL ADAPTATIF
  const phraseNettoyee = texteSource.charAt(0).toLowerCase() + texteSource.slice(1).replace(/[.!?]+$/, '');

  return {
    v1: `Je me permets de vous informer que ${phraseNettoyee}. Je reste à votre entière disposition pour tout échange complémentaire sur ce point.`,
    v2: `Bonjour, j'espère que vous vous portez bien. Je tenais à vous partager ce qui suit : ${phraseNettoyee}. N'hésitez pas à me faire signe si besoin, je reste à votre écoute !`,
    v3: `Pour information : ${texteSource.charAt(0).toUpperCase() + texteSource.slice(1).replace(/[.!?]+$/, '')}. Merci de bien vouloir me confirmer la bonne prise en compte.`
  };
}

const req1 = "reformule :c'est avec une grande tristesse que je quitte ce service";
const extracted = extraireTexteAReformuler(req1);
console.log('Texte extrait :', extracted);
const res = genererReformulationsIntelligentes(extracted);
console.log('Resultats :', res);
