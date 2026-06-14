import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { generateText, stepCountIs } = await import('ai');
  const { auth } = await import('../lib/auth');
  const { createCorsairAgentTools } = await import('../lib/agent/corsair-tools');
  const { getAgentModel, getAgentProviderLabel } = await import('../lib/agent/model');
  const { buildAgentSystemPrompt } = await import('../lib/agent/system-prompt');

  const userId = process.argv[2] ?? process.env.TEST_USER_ID;
  if (!userId) {
    console.error('Usage: npx tsx tests/test-ai-corsair.ts <userId>');
    process.exit(1);
  }

  console.log(`Testing Corsair MCP agent with user: ${userId}`);
  console.log(`Provider: ${getAgentProviderLabel()}`);

  const tools = createCorsairAgentTools(userId);
  console.log(`Tools: ${Object.keys(tools).join(', ')}`);

  const model = getAgentModel();

  const result = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(10),
    system: buildAgentSystemPrompt({
      userName: 'Tester',
      contextLabel: 'Folder: INBOX',
      workspaceMode: 'email',
      folder: 'INBOX',
      providerLabel: getAgentProviderLabel(),
    }),
    prompt:
      'List available gmail operations, then fetch my latest 3 inbox emails and summarize them.',
  });

  console.log('\n=== Final Answer ===');
  console.log(result.text || '(empty — check tool results below)');

  if (result.toolResults?.length) {
    console.log('\n=== Tools Executed ===');
    for (const r of result.toolResults) {
      console.log(`- ${r.toolName}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
