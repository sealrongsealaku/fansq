import { loadConfig } from "../config";
import { InternalApiService } from "../services/internal-api.service";

async function main() {
  const api = new InternalApiService(loadConfig());
  const result = await api.submitReflection({
    studentName: "本地测试同学",
    submitContent: "这是一条通过 qq-bot mock 脚本提交的测试反思。",
    submitTime: new Date().toISOString(),
    submitChannel: "qq_group_bot",
    sourceGroupId: "local-test-group",
    sourceGroupName: "本地测试群",
    rawMessageId: `mock-${Date.now()}`,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

