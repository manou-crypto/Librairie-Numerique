const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.categorie.createMany({
    data: [
      { nom: 'Livres', slug: 'livres' },
      { nom: 'Fournitures scolaires', slug: 'fournitures-scolaires' },
      { nom: 'Informatique', slug: 'informatique' },
      { nom: 'Bureautique', slug: 'bureautique' },
    ],
    skipDuplicates: true,
  });
  console.log('Categories inserées (racines) :', result.count);

  const parentes = await prisma.categorie.findMany();
  const getParentId = (slug) => parentes.find((p) => p.slug === slug)?.id_categorie;

  const subCategories = [
    { nom: 'Romans & Littérature', slug: 'romans-litterature', id_categorie_parente: getParentId('livres') },
    { nom: 'Manuels scolaires', slug: 'manuels-scolaires', id_categorie_parente: getParentId('livres') },
    { nom: 'Dictionnaires', slug: 'dictionnaires', id_categorie_parente: getParentId('livres') },
    { nom: 'Cahiers & Carnets', slug: 'cahiers-carnets', id_categorie_parente: getParentId('fournitures-scolaires') },
    { nom: 'Stylos & Crayons', slug: 'stylos-crayons', id_categorie_parente: getParentId('fournitures-scolaires') },
    { nom: 'Colle & Ciseaux', slug: 'colle-ciseaux', id_categorie_parente: getParentId('fournitures-scolaires') },
    { nom: 'Périphériques', slug: 'peripheriques', id_categorie_parente: getParentId('informatique') },
    { nom: 'Consommables', slug: 'consommables', id_categorie_parente: getParentId('informatique') },
    { nom: 'Stockage', slug: 'stockage', id_categorie_parente: getParentId('informatique') },
    { nom: 'Classement', slug: 'classement', id_categorie_parente: getParentId('bureautique') },
    { nom: 'Papier & Impression', slug: 'papier-impression', id_categorie_parente: getParentId('bureautique') },
  ].filter((c) => c.id_categorie_parente !== undefined);

  const subResult = await prisma.categorie.createMany({
    data: subCategories,
    skipDuplicates: true,
  });
  console.log('Sous-catégories insérées :', subResult.count);

  const all = await prisma.categorie.findMany();
  console.log('Total catégories en BDD :', all.length);
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
