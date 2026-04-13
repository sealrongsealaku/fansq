import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const names = [
  "小雨同学",
  "晨曦同学",
  "一鸣同学",
  "若溪同学",
  "星河同学",
  "安然同学",
  "子墨同学",
  "欣妍同学",
  "浩然同学",
  "思齐同学",
  "景行同学",
  "清和同学",
  "诗语同学",
  "知远同学",
  "向晚同学",
  "书言同学",
  "嘉禾同学",
  "语桐同学",
  "凌云同学",
  "明悦同学",
  "沐阳同学",
  "知夏同学",
  "念初同学",
  "听澜同学",
];

const contents = [
  "今天的课堂让我第一次把分数比较题真正听明白了，老师一步一步带着我们想，我也更敢回答问题了。",
  "原来语文阅读题不是只能背答案，老师提醒我们先找句子依据，我觉得这样做题更踏实。",
  "这节课里我最喜欢的是讨论环节，因为大家的想法都不一样，我发现原来同一道题可以从不同角度理解。",
  "以前我做题时总怕写错就不写，今天老师一直鼓励我们先表达再修改，我觉得自己没有那么害怕了。",
  "老师讲应用题的时候会把题目改成生活里的例子，这样我一下子就能理解题意。",
  "我今天最大的收获不是做对了多少题，而是知道遇到不会的时候可以先拆开看，不一定要一下子想出来。",
  "上课时老师让我们把思路讲给同学听，我发现讲出来之后自己反而更清楚了。",
  "这节英语课让我记住了几个新单词，因为老师一直让我们在句子里用，而不是只抄写。",
  "以前觉得数学很难是因为我总是急着算，今天老师提醒我们先看条件再动笔，我觉得错误少了。",
  "我很喜欢老师会在下课前带我们回顾，这样我知道自己这一节课到底学会了什么。",
  "今天我在课堂上第一次主动举手，虽然回答得不完整，但是老师夸我敢开口，我很开心。",
  "老师会把我们说过的答案认真写下来，我感觉自己的想法被看见了，所以更愿意参与。",
  "这次课堂里我学会了把长句子分开理解，阅读的时候没有以前那么乱了。",
  "我觉得支教课和以前不一样的地方是气氛更温和，回答错了也不会很紧张。",
  "今天老师讲作文的时候提醒我们先写真感受，我觉得这样写出来的内容更像自己。",
  "我以前不太敢和同学合作，但今天分组讨论时大家都很认真，我也更愿意说自己的想法。",
  "课堂最后的总结特别有用，我会知道这节课最核心的知识点是什么，不会只记得零散内容。",
  "老师讲题时会问我们为什么这样想，我觉得这让我不只是记答案，而是真的在思考。",
  "今天我发现自己原来可以把题目讲给别人听，这说明我不是完全不会，只是以前没有信心。",
  "最让我印象深的是老师一直告诉我们慢一点没关系，重要的是把每一步想清楚。",
  "我喜欢这种能互动的课堂，不是老师一直讲，我们一直听，而是大家一起完成。",
  "今天我学到一个办法，就是不会的时候先圈关键词，这让我做题时更有方向。",
  "这节课后我感觉自己不只是学会了一题，而是知道下次遇到类似题目该怎么想。",
  "老师让我们写反思这件事很好，因为我会认真想一想自己今天到底学到了什么。",
];

async function main() {
  const adminPasswordHash = await hash("admin123", 12);

  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
  });

  await prisma.reflectionLike.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.reflection.deleteMany();

  const now = Date.now();

  for (let i = 0; i < 24; i += 1) {
    const created = await prisma.reflection.create({
      data: {
        studentName: names[i],
        submitContent: contents[i],
        submitTime: new Date(now - i * 1000 * 60 * 90),
        submitChannel: "qq_group_bot",
        sourceGroupId: i < 12 ? "group-grade-6" : "group-grade-5",
        sourceGroupName: i < 12 ? "支教项目六年级群" : "支教项目五年级群",
        rawMessageId: `seed-${i + 1}`,
        auditStatus: i < 20 ? "approved" : i < 22 ? "pending" : "rejected",
        displayStatus: i < 18 ? "visible" : "hidden",
        isFeatured: i % 5 === 0,
        isTop: i === 0 || i === 6,
        isAnonymous: i % 4 === 0,
        displayName: i % 4 === 0 ? `匿名同学 ${i + 1}` : null,
        likeCount: i < 18 ? 3 + ((24 - i) % 9) : 0,
        remarks: i >= 22 ? "测试驳回数据" : null,
      },
    });

    if (i < 18) {
      const likeTotal = 3 + ((24 - i) % 9);

      for (let j = 0; j < likeTotal; j += 1) {
        await prisma.reflectionLike.create({
          data: {
            reflectionId: created.id,
            visitorId: `seed-visitor-${i + 1}-${j + 1}`,
          },
        });
      }
    }
  }

  console.log("Seeded 24 reflections successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
