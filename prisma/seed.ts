import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function seed() {
  // await prisma.$executeRawUnsafe(`drop database evaluation360degree`);
  // await prisma.$executeRawUnsafe(`create database evaluation360degree;`);
  //await prisma.$executeRawUnsafe(`use evaluation360degree;`);

  const email = "takezoux2@gmail.com";

  await prisma.$transaction([
    prisma.answerSelectionSet.deleteMany(),
    prisma.answerSelection.deleteMany(),
    prisma.term.deleteMany(),
    prisma.askSection.deleteMany(),
    prisma.askItem.deleteMany(),
    prisma.answerItem.deleteMany(),
    prisma.evaluation.deleteMany(),
    prisma.examination.deleteMany(),
    prisma.examAnswer.deleteMany(),
    prisma.examAnswerItem.deleteMany(),
    prisma.examQuestion.deleteMany(),
    prisma.examQuestionSelection.deleteMany(),
    prisma.examCheatLog.deleteMany(),
    prisma.password.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
    prisma.job.deleteMany(),
  ]);

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const adminRoles = await prisma.role.createMany({
    data: [
      {
        name: "ADMIN",
      },
      {
        name: "Member",
      },
    ],
  });
  const jobs = await prisma.job.createMany({
    data: [
      {
        name: "Engineer",
      },
      {
        name: "ProductManager",
      },
      {
        name: "SRE",
      },
      {
        name: "InfoSystem",
      },
      {
        name: "EngineerManager",
      },
    ],
    skipDuplicates: true,
  });
  const adminRole = await prisma.role.findUnique({
    where: {
      name: "ADMIN",
    },
  });
  const engineerJob = await prisma.job.findUnique({
    where: {
      name: "Engineer",
    },
  });
  const user1 = await prisma.user.create({
    data: {
      email,
      name: "Takeshita",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      roles: {
        connect: [{ id: adminRole?.id ?? 1 }],
      },
      Job: {
        connect: { id: engineerJob?.id ?? 1 },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "aaa@example.com",
      name: "HogeHoge",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      roles: {
        connect: [{ id: adminRole?.id ?? 1 }],
      },
      Job: {
        connect: { id: engineerJob?.id ?? 1 },
      },
    },
  });

  const answerSelectionSet = await prisma.answerSelectionSet.create({
    data: {
      name: "answerSelectionSet",
      explanation: "これはXXXです。\nLevel1はHOgehoge\nレベル2はフガフガです",
    },
  });
  for (let i = 1; i < 7; i++) {
    await prisma.answerSelection.create({
      data: {
        label: `answerSelection${i}`,
        value: i,
        answerSelectionSet: {
          connect: { id: answerSelectionSet.id },
        },
      },
    });
  }

  const term = await prisma.term.create({
    data: {
      name: "2023 1Q",
      explanationMarkdown: "2023 1Qの説明",
      startAt: new Date(),
      endAt: new Date(2024, 1, 1),
    },
  });

  const term2 = await prisma.term.create({
    data: {
      name: "2023 3Q",
      explanationMarkdown: "2023 1Qの説明",
      startAt: new Date(),
      endAt: new Date(2025, 1, 1),
    },
  });
  const section1 = await prisma.askSection.create({
    data: {
      label: "section1",
      term: { connect: { id: term.id } },
      answerSelectionSet: {
        connect: { id: answerSelectionSet.id },
      },
    },
  });
  const section2 = await prisma.askSection.create({
    data: {
      label: "section2",
      term: { connect: { id: term.id } },
      answerSelectionSet: {
        connect: { id: answerSelectionSet.id },
      },
    },
  });

  for (let i = 0; i < 7; i++) {
    await prisma.askItem.create({
      data: {
        askText: `askText${i}`,
        askSection: {
          connect: { id: section1.id },
        },
        ordering: i,
      },
    });
  }
  for (let i = 7; i < 10; i++) {
    await prisma.askItem.create({
      data: {
        askText: `askText${i}`,
        askSection: {
          connect: { id: section2.id },
        },
        ordering: i,
      },
    });
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      term: {
        connect: { id: term.id },
      },
      evaluator: {
        connect: { id: user1.id },
      },
      evaluatee: {
        connect: { id: user2.id },
      },
    },
  });

  const examination = await prisma.examination.create({
    data: {
      name: "examination",
      term: {
        connect: { id: term.id },
      },
      timeLimitInMinutes: 5,
    },
  });
  for (let i = 0; i < 10; i++) {
    const examQuestion = await prisma.examQuestion.create({
      data: {
        examination: {
          connect: { id: examination.id },
        },
        imagePath: "hoge.png",
        text: `これは${i + 1}問目です。
      以下の問題を解いてください。`,
        score: 1,
      },
    });

    await prisma.examQuestionSelection.createMany({
      data: [
        {
          examQuestionId: examQuestion.id,
          label: "examQuestion\nSelection1",
          isCorrectAnswer: false,
        },
        {
          examQuestionId: examQuestion.id,
          label: "examQuestionSelection2",
          isCorrectAnswer: true,
        },
      ],
    });
  }
  // スキルシート
  await prisma.skillCategory.createMany({
    data: [
      {
        name: "自社で使用している技術",
      },
      {
        name: "自社では使用していない技術",
      },
    ],
  });

  // 記述試験
  const essayExam = await prisma.essayExam.create({
    data: {
      name: "記述式試験1",
      term: {
        connect: { id: term.id },
      },
    },
  });
  {
    // 全回答
    const essayQuestionSection = await prisma.essayQuestionSection.create({
      data: {
        name: "essayQuestionSection1",
        answerType: "ANSWER_ALL",
        essayExam: {
          connect: { id: essayExam.id },
        },
      },
    });
    for (let i = 0; i < 2; i++) {
      await prisma.essayQuestion.create({
        data: {
          text: `全答問題${i + 1}`,
          detail: `全答問題の詳細${i + 1}
ちゃんと改行される`,
          maxAnswerTextLength: 50,
          essayQuestionSection: {
            connect: { id: essayQuestionSection.id },
          },
        },
      });
    }
  }
  {
    // 択一
    const essayQuestionSection = await prisma.essayQuestionSection.create({
      data: {
        name: "essayQuestionSection2",
        answerType: "CHOICE_ONE",
        essayExam: {
          connect: { id: essayExam.id },
        },
      },
    });
    for (let i = 0; i < 2; i++) {
      await prisma.essayQuestion.create({
        data: {
          text: `選択問題${i + 1}`,
          detail: `選択問題の詳細${i + 1}
ちゃんと改行される`,
          maxAnswerTextLength: 500,
          essayQuestionSection: {
            connect: { id: essayQuestionSection.id },
          },
        },
      });
    }
  }

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
