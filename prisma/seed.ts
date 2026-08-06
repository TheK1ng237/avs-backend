import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  console.log('🌱 Seeding AVS Backend…');

  // Vérifier si un SUPER_ADMIN existe déjà
  const existingSuperAdmin = await db.user.findFirst({
    where: { role: 'SUPER_ADMIN' as any },
  });

  let superAdmin;
  if (existingSuperAdmin) {
    console.log('✅ SUPER_ADMIN existe déjà, pas de création nécessaire.');
    superAdmin = existingSuperAdmin;
  } else {
    // Créer un SUPER_ADMIN par défaut
    superAdmin = await db.user.upsert({
      where: { email: 'superadmin@avs.dev' },
      update: {},
      create: {
        email: 'superadmin@avs.dev',
        name: 'Super Admin AVS',
        passwordHash: '$2b$10$uSMpCKxkJ4ONwaWyyy25y.nWluZmlpOyihRHyetjjMvLLHi9qwZTS', // Mot de passe: SuperAdmin123!
        role: 'SUPER_ADMIN' as any,
        verified: true,
      },
    });
    console.log('✅ SUPER_ADMIN créé: superadmin@avs.dev (mot de passe: SuperAdmin123!)');
  }

  // Créer/mettre à jour un admin normal pour les tests
  const admin = await db.user.upsert({
    where: { email: 'admin@avs.dev' },
    update: {},
    create: {
      email: 'admin@avs.dev',
      name: 'Admin AVS',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // À changer par le premier login
      role: 'ADMIN',
      verified: true,
    },
  });

  await db.pattern.upsert({
    where: { slug: 'ndop-bamoum' },
    update: {},
    create: {
      slug: 'ndop-bamoum',
      name: 'Ndop Royal Bamoum',
      nameLocal: 'Ndop Royal Bamoum',
      imgUrl: 'https://example.com/ndop.jpg',
      type: 'NDOP',
      cssClass: 'avs-pattern-ndop',
      summary: 'Tissu sacré tissé pour les cérémonies royales du Sultanat Bamoum.',
      history: 'Tissu sacré tissé pour les cérémonies royales du Sultanat Bamoum.',
      technique: 'Tissage traditionnel',
      ceremonial: 'Cérémonies royales',
      sources: ['https://example.com'],
      status: 'PUBLISHED',
      isFeatured: true,
      createdById: admin.id,
    },
  });

  console.log('✅ Seed terminé.');
}
main().catch(console.error).finally(() => void db.$disconnect());
