import cron from 'node-cron';
import { solutiiPrisma } from './src/lib/solutii-prisma';

// ===== Atualiza 01:00, 12:00 e 17:00, todos os dias a view materializada "Apontamentos" =====
// cron.schedule('0 1,12,17 * * *', async () => {
//   try {
//     console.log('[CRON] Atualizando view materializada...');
//     await solutiiPrisma.$executeRawUnsafe(
//       'REFRESH MATERIALIZED VIEW CONCURRENTLY public."Apontamentos"',
//     );
//     console.log('[CRON] Atualização concluída.');
//   } catch (error) {
//     console.error('[CRON] Erro ao atualizar view:', error);
//   }
// });
// ===============================================================================

// ===== Atualiza 01:00, 11:40 e 16:40, todos os dias a view materializada "Apontamentos" =====
cron.schedule('0 1 * * *', async () => {
  try {
    console.log('[CRON] Atualizando view materializada às 01:00...');
    await solutiiPrisma.$executeRawUnsafe(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY public."Apontamentos"',
    );
    console.log('[CRON] Atualização concluída.');
  } catch (error) {
    console.error('[CRON] Erro ao atualizar view:', error);
  }
});

cron.schedule('40 11,16 * * *', async () => {
  try {
    console.log('[CRON] Atualizando view materializada...');
    await solutiiPrisma.$executeRawUnsafe(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY public."Apontamentos"',
    );
    console.log('[CRON] Atualização concluída.');
  } catch (error) {
    console.error('[CRON] Erro ao atualizar view:', error);
  }
});
// ===============================================================================
