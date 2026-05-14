import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const doc = await getDocument('fiche_activit_traitement.pdf').promise;
for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
  const page = await doc.getPage(i);
  const tc = await page.getTextContent();
  console.log(`=== PAGE ${i} ===`);
  console.log(tc.items.map(it => it.str).join(' '));
}
