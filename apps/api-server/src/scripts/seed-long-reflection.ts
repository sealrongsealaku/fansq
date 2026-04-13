import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const longReflection = `今天这节支教课给我的感觉特别深，因为我第一次很清楚地感受到，原来“听懂”和“会做”之间还隔着很多需要慢慢想明白的过程。以前上数学课的时候，我经常会在老师讲题的时候觉得自己好像听懂了，可是一到自己真正拿起笔去写，就会突然不知道从哪一步开始。今天老师没有急着告诉我们答案，而是先带着我们一起分析题目里的条件，让我们自己圈出关键的信息，再一步一步把每个条件和问题联系起来。我发现这种方法真的很有用，因为它不是直接把答案放在我面前，而是让我知道为什么要这样想、为什么这一步不能跳过去。

这节课里我印象最深的是老师一直在鼓励我们把自己的想法说出来。以前我特别害怕回答问题，因为我总觉得如果说错了会很尴尬，也担心别人会觉得我太笨。但是今天老师在我回答得不完整的时候，没有直接否定我，而是顺着我的思路继续问我，让我自己慢慢把后面的内容补上。我第一次觉得，原来课堂不是只有“答对”和“答错”两种结果，更重要的是你有没有认真思考、有没有愿意把自己的想法表达出来。这样的感觉让我没有以前那么紧张，也让我更愿意参与讨论。

我还发现，老师会把复杂的问题拆成几个小问题来讲，这样我在做题的时候就不会一下子被题目吓住。以前看到字很多的应用题，我经常连读都不想读完，总觉得自己一定做不出来。但今天老师让我先不用急着算，只需要先想清楚“题目在说什么”“已经告诉了我什么”“最后要我求什么”，这样一来题目就没有原来那么难了。我觉得自己今天真正学到的，不只是这道题怎么做，而是一种以后遇到难题时也可以继续用的方法。

下课以后我还一直在想，支教课带给我的收获可能不仅是知识本身，还有一种慢慢建立起来的信心。老师会认真听我们讲话，也会记住我们上次哪里不会、这次有没有进步，这让我觉得自己的学习过程是被看见的。我希望以后上课的时候，自己可以继续像今天一样，先大胆表达，再认真修改，不因为一开始不会就放弃。我觉得如果我能一直保持这种学习方式，可能不只是数学，其他科目也会慢慢有进步。`;

async function main() {
  const created = await prisma.reflection.create({
    data: {
      studentName: "长文测试同学",
      submitContent: longReflection,
      submitTime: new Date(),
      submitChannel: "qq_group_bot",
      sourceGroupId: "group-grade-6",
      sourceGroupName: "支教项目六年级群",
      rawMessageId: `long-seed-${Date.now()}`,
      auditStatus: "approved",
      displayStatus: "visible",
      isFeatured: true,
      isTop: true,
      isAnonymous: false,
      displayName: null,
      likeCount: 16,
      remarks: "长文本展示效果测试数据",
    },
  });

  for (let i = 0; i < 16; i += 1) {
    await prisma.reflectionLike.create({
      data: {
        reflectionId: created.id,
        visitorId: `long-seed-visitor-${i + 1}`,
      },
    });
  }

  console.log(`Seeded long reflection with id=${created.id.toString()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
