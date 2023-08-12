import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function seed() {


  const email = "takezoux2@gmail.com";

  // cleanup the existing database
  await prisma.role.delete({ where: { name: "ADMIN" } }).catch(() => {
  });
  await prisma.job.deleteMany({ where: {name: "Engineer"}}).catch(() => {
  });
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });
  await prisma.answerSelectionSet.deleteMany().catch(() => {
  });
  await prisma.term.deleteMany().catch(() => {
  });


  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN"
    }
  })
  const engineerJob = await prisma.job.create({
    data: {
      name: "Engineer"
    }
  })
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
        connect: [
          {id: adminRole.id}
        ]
      },
      Job: {
        connect: { id: engineerJob.id}
      }
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
        connect: [
          {id: adminRole.id}
        ]
      },
      Job: {
        connect: { id: engineerJob.id}
      }
    },
  });

  const answerSelectionSet = await prisma.answerSelectionSet.create({
    data: {
      name: "answerSelectionSet"
    }
  })
  for(let i = 1; i < 7; i++) {
    await prisma.answerSelection.create({
      data: {
        label: `answerSelection${i}`,
        value: i,
      }
    })
  }



  const term = await prisma.term.create({
    data: {
      name: "2023 1Q",
      explanationMarkdown: "2023 1Qの説明",
      startAt: new Date(),
      endAt: new Date()
    }
  })
  const section1 = await prisma.askSection.create({
    data: {
      label: "section1",
      term: { connect: {id: term.id} },
      answerSelectionSet: {
        connect: {id: answerSelectionSet.id}
      }
    }
  })
  const section2 = await prisma.askSection.create({
    data: {
      label: "section2",
      term: { connect: {id: term.id} },
      answerSelectionSet: {
        connect: {id: answerSelectionSet.id}
      }
    }
  })

  for(let i = 0; i < 7; i++) {
    await prisma.askItem.create({
      data: {
        askText: `askText${i}`,
        askSection: {
          connect: {id: section1.id}
        },
        ordering: i
      }
    })
  }
  for(let i = 7; i < 10; i++) {
    await prisma.askItem.create({
      data: {
        askText: `askText${i}`,
        askSection: {
          connect: {id: section2.id}
        },
        ordering: i
      }
    })
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      term: {
        connect: {id: term.id}
      },
      evaluator: {
        connect: {id: user1.id}
      },
      evaluatee: {
        connect: {id: user2.id}
      }
    }
  })




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
