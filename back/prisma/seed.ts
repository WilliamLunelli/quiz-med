import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedQuestion = {
  text: string;
  correctAnswer: boolean;
  difficulty: string;
  hint?: string | null;
  explanation: string;
  order?: number;
};

type SeedFile = {
  game: {
    title: string;
    groupName?: string;
    subjectTitle: string;
    coverPhotoUrl?: string | null;
    primaryColor?: string;
  };
  questions: SeedQuestion[];
};

// O arquivo fornecido chama-se seed-final.json; aceitamos também questions-seed.json.
const CANDIDATES = ['seed-final.json', 'questions-seed.json'];

function loadSeed(): SeedFile {
  for (const name of CANDIDATES) {
    const path = resolve(process.cwd(), name);
    if (existsSync(path)) {
      console.log(`Lendo seed de: ${name}`);
      return JSON.parse(readFileSync(path, 'utf-8')) as SeedFile;
    }
  }
  throw new Error(`Arquivo de seed não encontrado. Esperado um de: ${CANDIDATES.join(', ')}`);
}

async function main() {
  const seed = loadSeed();

  // Reseed limpo: remove jogo(s) anterior(es) com o mesmo título (cascata apaga perguntas/tentativas).
  const removed = await prisma.game.deleteMany({ where: { title: seed.game.title } });
  if (removed.count > 0) {
    console.log(`Removido(s) ${removed.count} jogo(s) anterior(es) com o mesmo título.`);
  }

  const game = await prisma.game.create({
    data: {
      title: seed.game.title,
      groupName: seed.game.groupName ?? '',
      subjectTitle: seed.game.subjectTitle,
      coverPhotoUrl: seed.game.coverPhotoUrl ?? null,
      ...(seed.game.primaryColor ? { primaryColor: seed.game.primaryColor } : {}),
      questions: {
        create: seed.questions.map((q, i) => ({
          text: q.text,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          hint: q.hint ?? null,
          explanation: q.explanation,
          order: q.order ?? i,
        })),
      },
    },
    include: { questions: true },
  });

  const counts = game.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  console.log('\nSeed concluído.');
  console.log(`  gameId: ${game.id}`);
  console.log(`  título: ${game.title}`);
  console.log(`  perguntas por nível:`, counts);
  console.log(`  total: ${game.questions.length}`);
}

main()
  .catch((e) => {
    console.error('Falha no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
