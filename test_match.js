const personnel = [
  { id: 10, nom: 'BOUACHIR', prenom: 'Zahra' },
  { id: 11, nom: 'ALLIMOURI', prenom: 'BOUCHAIB' },
  { id: 12, nom: 'BAADI KHADOUJ', prenom: '' }
];

const testNames = ["BOUACHIR ZAHRA", "ALLIMOURI BOUCHAIB", "BAADI KHADOUJ", "NEW GUY"];

testNames.forEach(nom => {
   const excelNom = nom.toUpperCase().replace(/\s+/g, ' ');
   let emp = personnel.find(p => {
     const pNom = (p.nom || '').toUpperCase();
     const pPrenom = (p.prenom || '').toUpperCase();
     const pNomComplet = `${pNom} ${pPrenom}`.trim().replace(/\s+/g, ' ');
     const pNomInvers = `${pPrenom} ${pNom}`.trim().replace(/\s+/g, ' ');
     return pNom === excelNom || pNomComplet === excelNom || pNomInvers === excelNom || pNom.includes(excelNom) || excelNom.includes(pNomComplet);
   });
   console.log(`${nom} -> ${emp ? emp.nom : 'NOT FOUND'}`);
});
