import { createInterface } from 'node:readline';
import { appendFileSync } from 'node:fs';
const log = process.argv[2];
const send = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
createInterface({ input: process.stdin }).on('line', line => {
  const message = JSON.parse(line); if (message.id === undefined) return;
  if (message.method === 'initialize') return send(message.id, { protocolVersion: message.params.protocolVersion, capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'test', version: '1' }, instructions: 'test MCP instructions' });
  if (message.method === 'tools/list') return send(message.id, { tools: [{ name: 'ping', description: 'A harmless test', inputSchema: { type: 'object', properties: {} } }] });
  if (message.method === 'tools/call') { appendFileSync(log, 'called\n'); return send(message.id, { content: [{ type: 'text', text: 'pong' }] }); }
  if (message.method === 'resources/list') return send(message.id, { resources: [{ uri: 'test://one', name: 'one' }] });
  if (message.method === 'resources/templates/list') return send(message.id, { resourceTemplates: [] });
  if (message.method === 'resources/read') return send(message.id, { contents: [{ uri: 'test://one', text: 'test data' }] });
  if (message.method === 'ping') return send(message.id, {});
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'not found' } }) + '\n');
});
