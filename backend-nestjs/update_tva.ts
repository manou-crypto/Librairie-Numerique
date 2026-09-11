import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Mise à jour des produits pour mettre taux_tva à 0...');
  const resultProducts = await prisma.$executeRaw`UPDATE produit SET taux_tva = 0.00;`;
  console.log(`${resultProducts} produits mis à jour.`);

  console.log('Mise à jour des lignes de vente (tauxTvaSnapshot = 0)...');
  const resultLignes = await prisma.$executeRaw`UPDATE ligne_vente SET taux_tva_snapshot = 0.00;`;
  console.log(`${resultLignes} lignes de vente mises à jour.`);

  // Update total_tva in vente table
  console.log('Recalcul du total_tva, total_ht et total_ttc sur les ventes...');
  const ventes = await prisma.vente.findMany({
    include: { lignes: true }
  });

  for (const v of ventes) {
    let totalTtc = 0;
    let totalHt = 0;
    
    for (const l of v.lignes) {
      const qte = Number(l.quantite);
      const prixHt = Number(l.prix_vente_unitaire_ht_snapshot);
      const montantHtLigne = qte * prixHt;
      totalTtc += montantHtLigne; // Puisque TVA = 0, TTC = HT
      totalHt += montantHtLigne;
    }

    const totalTva = 0;
    
    await prisma.vente.update({
      where: { id_vente: v.id_vente },
      data: {
        total_ttc: totalTtc,
        total_ht: totalHt,
        total_tva: totalTva
      }
    });
  }
  console.log(`${ventes.length} ventes recalculées et mises à jour.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
