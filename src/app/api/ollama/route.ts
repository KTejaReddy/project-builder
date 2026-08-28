import { NextRequest, NextResponse } from 'next/server';
import { 
  extractJSON, 
  repairJSON, 
  validateSchema, 
  SCHEMAS, 
  convertToJSONSchema,
  unpackNestedJSONStrings
} from '@/utils/ai/parser';

const OLLAMA_TIMEOUT_MS = 180000; // 3 minutes for long generations (database, lessons)

function tryParseAndValidate(responseText: string, schemaKey: string | null): { success: boolean; data: any; errors: string[] } {
  const extracted = extractJSON(responseText);
  if (!extracted) {
    return { success: false, data: null, errors: ['No JSON extracted from response'] };
  }

  // 1. JSON Parsing Validation
  let parsed: any;
  try {
    parsed = unpackNestedJSONStrings(JSON.parse(extracted));
  } catch (err: any) {
    // 2. Automatic Repair if raw JSON fails
    console.log(`[Server-side Validation] Parse failed: ${err.message}. Attempting auto-repair...`);
    const repaired = repairJSON(extracted);
    try {
      parsed = unpackNestedJSONStrings(JSON.parse(repaired));
      console.log(`[Server-side Validation] Auto-repair succeeded!`);
    } catch (repairErr: any) {
      return { success: false, data: null, errors: [`JSON Parse & Repair failed: ${err.message} -> ${repairErr.message}`] };
    }
  }

  // 3. Schema Validation
  if (schemaKey) {
    const schema = SCHEMAS[schemaKey as keyof typeof SCHEMAS];
    if (schema) {
      const result = validateSchema(parsed, schema, schemaKey);
      if (!result.valid) {
        // Log exactly which property failed validation
        console.error(`[Server-side Validation] Schema validation failed for "${schemaKey}":`);
        result.errors.forEach(e => console.error(`  → ${e}`));
        return { success: false, data: parsed, errors: result.errors };
      }
    }
  }

  return { success: true, data: parsed, errors: [] };
}

function getFallbackJsonForSchema(schemaKey: string): any {
  if (schemaKey === 'planner') {
    return {
      overview: 'Project initialization roadmap planning.',
      estimatedTime: '12 Hours',
      xpReward: 1200,
      skills: ['TypeScript', 'Node.js'],
      objectives: ['Scaffold base application'],
      roadmap: [{ id: 'm1', title: 'Setup', description: 'Initialize directories', status: 'todo', estimatedHours: 2 }]
    };
  }
  if (schemaKey === 'architecture') {
    return {
      systemDiagram: 'Client Browser connects to API server gateway and database repository.',
      databaseDiagram: 'Users table manages credentials profiles.',
      flowDiagram: 'Client -> Router -> Gateway Handler -> DB Transaction.',
      componentDiagram: 'Views render layouts linked to context states.'
    };
  }
  if (schemaKey === 'database') {
    return {
      dbSchemas: [{
        table: 'users',
        columns: [{ name: 'id', type: 'UUID', key: 'PK', nullable: false, references: null }],
        sql: 'CREATE TABLE users (id UUID PRIMARY KEY);'
      }]
    };
  }
  if (schemaKey === 'folder') {
    return {
      files: [{ name: 'index.tsx', path: 'src/index.tsx', type: 'file', content: '// Entry' }]
    };
  }
  if (schemaKey === 'api') {
    return {
      apiDocs: [{
        method: 'GET',
        endpoint: '/api/health',
        description: 'Check health status',
        headers: {},
        requestBody: null,
        responseBody: { status: 'ok' },
        statusCodes: [{ code: 200, description: 'Success' }]
      }]
    };
  }
  if (schemaKey === 'lesson') {
    return {
      lessons: [{
        id: 'l1',
        title: 'Project Scaffolding Overview',
        objective: 'Learn structure setups',
        explanation: 'Configure layout definitions',
        theory: 'Clean architecture rules',
        code: '// Setup code',
        path: 'src/index.tsx',
        whyWeDoThis: 'Ensure structure robustness',
        commonMistakes: ['Malformed paths'],
        bestPractices: ['Use index files'],
        quiz: [{ id: 'q1', question: 'Valid?', options: ['Yes', 'No'], correctAnswer: 0, explanation: 'Correct' }],
        challenge: { title: 'Code check', instructions: 'Return true', initialCode: '//', solution: 'true' },
        completed: false
      }]
    };
  }
  if (schemaKey === 'career') {
    return {
      resumeBulletPoints: ['Designed and built production framework modules.'],
      linkedinDescription: 'Completed advanced full-stack software application scaffolding.',
      interviewQuestions: [{ question: 'How is state managed?', answer: 'Using clean context hooks', topic: 'Architecture' }]
    };
  }
  if (schemaKey === 'documentation') {
    return {
      readme: '# Project README\n\nGenerated scaffolding.'
    };
  }
  return {};
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, endpoint, ...params } = body;
  const ollamaUrl = (endpoint || 'http://localhost:11434').replace(/\/$/, '');

  console.log(`[Ollama Proxy] action=${action} model=${params.model} endpoint=${ollamaUrl}`);

  try {
    if (action === 'tags') {
      const res = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Tags request failed (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'generate') {
      const generateBody: Record<string, any> = {
        model: params.model || 'llama3.2',
        prompt: params.prompt,
        stream: params.stream === true,
      };

      if (params.schemaKey) {
        generateBody.schemaKey = params.schemaKey;
        generateBody.format = convertToJSONSchema(params.schemaKey);
      } else if (params.format === 'json') {
        generateBody.format = 'json';
      }

      if (params.options && typeof params.options === 'object') {
        const cleanOptions: Record<string, any> = {};
        if (params.options.temperature !== undefined) cleanOptions.temperature = params.options.temperature;
        if (params.options.top_p !== undefined) cleanOptions.top_p = params.options.top_p;
        if (params.options.num_ctx !== undefined) cleanOptions.num_ctx = params.options.num_ctx;
        if (params.options.num_predict !== undefined) cleanOptions.num_predict = params.options.num_predict;
        if (Object.keys(cleanOptions).length > 0) generateBody.options = cleanOptions;
      }

      if (params.system && typeof params.system === 'string' && params.system.trim()) {
        generateBody.system = params.system;
      }

      if (params.keep_alive) {
        generateBody.keep_alive = params.keep_alive;
      }

      console.log(`[Ollama Proxy] generate body:`, JSON.stringify({ ...generateBody, prompt: generateBody.prompt?.substring(0, 100) + '...' }));

      if (generateBody.stream) {
        const res = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generateBody),
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          throw new Error(`Ollama generate failed (${res.status}): ${errText}`);
        }

        return new Response(res.body, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
          },
        });
      }

      // Non-streaming with fallback JSON Schema support
      let res: Response;
      try {
        res = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generateBody),
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        });
      } catch (err: any) {
        if (generateBody.schemaKey) {
          console.warn(`[Ollama Proxy] Initial generate failed with schema format. Falling back to "json" string...`);
          const fallbackBody = { ...generateBody, format: 'json' };
          res = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackBody),
            signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
          });
        } else {
          throw err;
        }
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Ollama generate failed (${res.status}): ${errText}`);
      }

      let data = await res.json();
      let responseText = data.response || '';

      // ── Server-side validation, repair & retry pipeline ──
      let validation = tryParseAndValidate(responseText, params.schemaKey);
      if (!validation.success) {
        console.warn(`[Ollama Proxy] Generated response was invalid JSON. Retrying model correction...`);
        const retryPrompt = `${params.prompt}\n\nThe previous response was invalid JSON.\nReturn ONLY corrected JSON.\nDo not change the content.`;
        
        const retryBody = { 
          ...generateBody, 
          prompt: retryPrompt,
          format: 'json' // Fall back to simple json format on correction retry to be safest
        };

        try {
          const retryRes = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryBody),
            signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
          });

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const retryResponseText = retryData.response || '';
            validation = tryParseAndValidate(retryResponseText, params.schemaKey);
            if (validation.success) {
              data = retryData;
            }
          }
        } catch (retryErr: any) {
          console.error(`[Ollama Proxy] Model retry correction failed:`, retryErr.message);
        }
      }

      if (validation.success) {
        data.response = JSON.stringify(validation.data);
      } else {
        console.error(`[Ollama Proxy] Auto-repair failed. Returning safe placeholder JSON for key "${params.schemaKey}"`);
        const fallbackObj = getFallbackJsonForSchema(params.schemaKey);
        data.response = JSON.stringify(fallbackObj);
      }

      return NextResponse.json(data);
    }

    if (action === 'chat') {
      const chatBody: Record<string, any> = {
        model: params.model || 'llama3.2',
        messages: params.messages || [],
        stream: params.stream === true,
      };

      if (params.schemaKey) {
        chatBody.schemaKey = params.schemaKey;
        chatBody.format = convertToJSONSchema(params.schemaKey);
      } else if (params.format === 'json') {
        chatBody.format = 'json';
      }

      if (params.options && typeof params.options === 'object') {
        const cleanOptions: Record<string, any> = {};
        if (params.options.temperature !== undefined) cleanOptions.temperature = params.options.temperature;
        if (params.options.top_p !== undefined) cleanOptions.top_p = params.options.top_p;
        if (params.options.num_ctx !== undefined) cleanOptions.num_ctx = params.options.num_ctx;
        if (params.options.num_predict !== undefined) cleanOptions.num_predict = params.options.num_predict;
        if (Object.keys(cleanOptions).length > 0) chatBody.options = cleanOptions;
      }

      if (params.keep_alive) {
        chatBody.keep_alive = params.keep_alive;
      }

      console.log(`[Ollama Proxy] chat messages count=${chatBody.messages.length}`);

      if (chatBody.stream) {
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatBody),
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          throw new Error(`Ollama chat failed (${res.status}): ${errText}`);
        }

        return new Response(res.body, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
          },
        });
      }

      let res: Response;
      try {
        res = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatBody),
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        });
      } catch (err: any) {
        if (chatBody.schemaKey) {
          console.warn(`[Ollama Proxy] Initial chat failed with schema format. Falling back to "json" string...`);
          const fallbackBody = { ...chatBody, format: 'json' };
          res = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackBody),
            signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
          });
        } else {
          throw err;
        }
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Ollama chat failed (${res.status}): ${errText}`);
      }

      let data = await res.json();
      let responseText = data.message?.content || '';

      // ── Server-side validation, repair & retry pipeline ──
      let validation = tryParseAndValidate(responseText, params.schemaKey);
      if (!validation.success) {
        console.warn(`[Ollama Proxy] Chat response was invalid JSON. Retrying model correction...`);
        const retryMessages = [
          ...(chatBody.messages || []),
          { role: 'assistant', content: responseText },
          { role: 'user', content: 'The previous response was invalid JSON. Return ONLY corrected JSON. Do not change the content.' }
        ];

        const retryBody = {
          ...chatBody,
          messages: retryMessages,
          format: 'json'
        };

        try {
          const retryRes = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryBody),
            signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
          });

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const retryResponseText = retryData.message?.content || '';
            validation = tryParseAndValidate(retryResponseText, params.schemaKey);
            if (validation.success) {
              data = retryData;
            }
          }
        } catch (retryErr: any) {
          console.error(`[Ollama Proxy] Chat retry correction failed:`, retryErr.message);
        }
      }

      if (validation.success) {
        data.message = { role: 'assistant', content: JSON.stringify(validation.data) };
      } else {
        console.error(`[Ollama Proxy] Auto-repair failed. Returning safe placeholder JSON for key "${params.schemaKey}"`);
        const fallbackObj = getFallbackJsonForSchema(params.schemaKey);
        data.message = { role: 'assistant', content: JSON.stringify(fallbackObj) };
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });

  } catch (error: any) {
    console.error(`[Ollama Proxy] Error for action=${action}:`, error);

    let message = 'Unknown error';
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      message = 'Request timed out. The model may be loading — try again in a moment.';
    } else if (
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('fetch failed') ||
      error.cause?.code === 'ECONNREFUSED'
    ) {
      message = `Connection refused. Make sure Ollama is running at ${ollamaUrl}. Start it with: ollama serve`;
    } else {
      message = error.message || 'Ollama proxy error';
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
