/** Match the native tool composition and batch API of each tested Harness release. */
export async function mountExecutor(ctx) {
  if (typeof ctx.tools.setExecutor === 'function') await ctx.plugin(await import('@deepseek-ai/dsh-tool-executor-native')).await();
}
export async function executeTool(ctx, input) {
  if (typeof ctx.tools.setExecutor !== 'function') return ctx.tools.execute(input);
  const batch = await ctx.tools.execute({calls:[{type:'tool-call',id:input.callId,name:input.name,arguments:JSON.stringify(input.arguments)}],signal:input.signal,...(input.agent?{agent:input.agent}:{})});
  return batch.results[0].result;
}
