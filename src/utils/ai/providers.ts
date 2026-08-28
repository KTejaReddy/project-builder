import { AIProviderConfig, AIProviderType } from '../../types/ai';

export interface AiProvider {
  generate(prompt: string, modelName?: string, options?: any): Promise<string>;
  generateWithOptions?(prompt: string, opts?: { numPredict?: number; timeoutMs?: number; temperature?: number; maxRetries?: number; schemaKey?: string }): Promise<string>;
  generateStream?(prompt: string, onChunk: (text: string) => void, modelName?: string, options?: any): Promise<string>;
  chat?(messages: any[], modelName?: string, options?: any): Promise<string>;
  chatStream?(messages: any[], onChunk: (text: string) => void, modelName?: string, options?: any): Promise<string>;
  embeddings?(text: string): Promise<number[]>;
  vision?(imageBytes: string, prompt: string): Promise<string>;
  toolCalling?(tools: any[], prompt: string): Promise<any>;
}

export const STRICT_JSON_SYSTEM_RULE = `\nReturn ONLY valid JSON.
Never return markdown.
Never return \`\`\`json.
Never include explanations.
Never include comments.
Never include trailing commas.
Never include unescaped quotation marks.
Escape every newline inside strings.
Escape every quote inside strings.
Never place JSON inside strings.`;

export class OpenAIProvider implements AiProvider {
  private apiKey?: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  async generate(prompt: string, modelName = 'gpt-4o'): Promise<string> {
    const key = this.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : process.env.OPENAI_API_KEY);
    if (!key) throw new Error('API_KEY_MISSING: OpenAI API key is missing. Please configure it in your Settings.');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API_ERROR: OpenAI request failed: ${err.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  }
}

export class GeminiProvider implements AiProvider {
  private apiKey?: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  async generate(prompt: string, modelName = 'gemini-1.5-pro'): Promise<string> {
    const key = this.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : process.env.GEMINI_API_KEY);
    if (!key) throw new Error('API_KEY_MISSING: Gemini API key is missing. Please configure it in your Settings.');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API_ERROR: Gemini request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

export class ClaudeProvider implements AiProvider {
  private apiKey?: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  async generate(prompt: string, modelName = 'claude-3-5-sonnet-20241022'): Promise<string> {
    const key = this.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('claude_api_key') : process.env.ANTHROPIC_API_KEY);
    if (!key) throw new Error('API_KEY_MISSING: Claude API key is missing. Please configure it in your Settings.');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API_ERROR: Claude request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.content?.[0]?.text || '';
  }
}

export class GroqProvider implements AiProvider {
  private apiKey?: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  async generate(prompt: string, modelName = 'llama3-8b-8192'): Promise<string> {
    const key = this.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('groq_api_key') : process.env.GROQ_API_KEY);
    if (!key) throw new Error('API_KEY_MISSING: Groq API key is missing. Please configure it in your Settings.');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`API_ERROR: Groq request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  }
}

export class OllamaProvider implements AiProvider {
  private baseUrl: string;
  private settings: {
    model: string;
    temperature: number;
    topP: number;
    numCtx: number;
    maxTokens: number;
    keepAlive: string;
    streaming: boolean;
  };

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');

    // Load configurations from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.settings = {
        model: localStorage.getItem('ollama_model') || 'llama3:latest',
        temperature: Number(localStorage.getItem('ollama_temperature') || '0.7'),
        topP: Number(localStorage.getItem('ollama_top_p') || '0.9'),
        numCtx: Number(localStorage.getItem('ollama_context_length') || '4096'),
        maxTokens: Number(localStorage.getItem('ollama_max_tokens') || '2048'),
        keepAlive: localStorage.getItem('ollama_keep_alive') || '5m',
        streaming: localStorage.getItem('ollama_streaming') !== 'false'
      };
    } else {
      // Server-side defaults
      this.settings = {
        model: 'llama3:latest',
        temperature: 0.7,
        topP: 0.9,
        numCtx: 4096,
        maxTokens: 2048,
        keepAlive: '5m',
        streaming: false  // Server-side always non-streaming for JSON parsing
      };
    }
  }

  // Determine the active model name
  private activeModel(modelName?: string): string {
    return modelName || this.settings.model || 'llama3:latest';
  }

  // Build a clean generate request body with no undefined/null fields
  private buildGenerateBody(
    prompt: string,
    useJsonFormat: boolean,
    modelName: string,
    stream: boolean,
    system?: string,
    schemaKey?: string
  ): Record<string, any> {
    const finalPrompt = (schemaKey || useJsonFormat)
      ? prompt.trim() + '\n' + STRICT_JSON_SYSTEM_RULE
      : prompt.trim();

    const body: Record<string, any> = {
      model: this.activeModel(modelName),
      prompt: finalPrompt,
      stream: stream,
      options: {
        temperature: this.settings.temperature,
        top_p: this.settings.topP,
        num_ctx: this.settings.numCtx,
        num_predict: this.settings.maxTokens,
      },
      keep_alive: this.settings.keepAlive,
    };

    if (schemaKey) {
      body.schemaKey = schemaKey;
    } else if (useJsonFormat && !stream) {
      body.format = 'json';
    }

    // Only add system prompt if it has actual content
    if (system && system.trim()) {
      body.system = system.trim();
    }

    return body;
  }

  // Route request to proxy (browser) or direct (server)
  private async fetchOllama(
    action: 'generate' | 'chat',
    bodyData: Record<string, any>,
    timeoutMs = 120000
  ): Promise<Response> {
    const isBrowser = typeof window !== 'undefined';

    let url: string;
    let requestBody: string;

    if (isBrowser) {
      // Browser: go through Next.js proxy to avoid CORS
      url = '/api/ollama';
      requestBody = JSON.stringify({ action, endpoint: this.baseUrl, ...bodyData });
    } else {
      // Server: call Ollama directly
      url = `${this.baseUrl}/api/${action}`;
      requestBody = JSON.stringify(bodyData);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      let errMsg = `Ollama error ${response.status}`;
      try {
        const errData = await response.json();
        errMsg = errData.error || errMsg;
      } catch {
        try {
          const errText = await response.text();
          if (errText) errMsg = errText;
        } catch {}
      }
      throw new Error(errMsg);
    }

    return response;
  }

  async generate(prompt: string, modelName = 'llama3:latest', options: any = {}): Promise<string> {
    const useJsonFormat = options.format === 'json';
    const body = this.buildGenerateBody(
      prompt,
      useJsonFormat,
      this.activeModel(modelName),
      false,
      options.system,
      options.schemaKey
    );
    // Allow per-call num_predict override
    if (options.numPredict) body.options.num_predict = options.numPredict;
    const timeoutMs = options.timeoutMs ?? 120000;
    const response = await this.fetchOllama('generate', body, timeoutMs);
    const result = await response.json();
    return result.response || '';
  }

  /**
   * generateWithOptions — generate with explicit timeout + token budget + exponential backoff retry.
   * Use this for long-running steps like database schema and lessons.
   */
  async generateWithOptions(
    prompt: string,
    opts: {
      numPredict?: number;
      timeoutMs?: number;
      temperature?: number;
      maxRetries?: number;
      schemaKey?: string;
    } = {}
  ): Promise<string> {
    const { numPredict = 1024, timeoutMs = 180000, temperature, maxRetries = 2, schemaKey } = opts;
    const body = this.buildGenerateBody(
      prompt, 
      false, 
      this.activeModel(), 
      false, 
      undefined, 
      schemaKey
    );
    body.options.num_predict = numPredict;
    if (temperature !== undefined) body.options.temperature = temperature;

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s...
        console.log(`[OllamaProvider] Retry attempt ${attempt} after ${backoffMs}ms backoff`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
      try {
        const response = await this.fetchOllama('generate', body, timeoutMs);
        const result = await response.json();
        return result.response || '';
      } catch (err: any) {
        lastErr = err;
        const isRetryable = (
          err.name === 'TimeoutError' ||
          err.message?.includes('timeout') ||
          err.message?.includes('timed out') ||
          err.code === 'ECONNREFUSED' ||
          err.message?.includes('fetch failed')
        );
        if (!isRetryable || attempt === maxRetries) break;
        console.warn(`[OllamaProvider] Retryable error on attempt ${attempt}: ${err.message}`);
      }
    }
    throw lastErr ?? new Error('generateWithOptions: all retries exhausted');
  }

  async generateStream(
    prompt: string,
    onChunk: (text: string) => void,
    modelName = 'llama3:latest',
    options: any = {}
  ): Promise<string> {
    // Never use format: 'json' in streaming mode — Ollama buffers everything first
    const body = this.buildGenerateBody(
      prompt,
      false, // no JSON format in stream
      this.activeModel(modelName),
      true, // streaming
      options.system
    );

    const response = await this.fetchOllama('generate', body);
    if (!response.body) throw new Error('Response body is null — cannot stream');
    return await this.streamNDJSON(response.body, onChunk, false);
  }

  async chat(messages: any[], modelName = 'llama3:latest', options: any = {}): Promise<string> {
    const body: Record<string, any> = {
      model: this.activeModel(modelName),
      messages: messages,
      stream: false,
      options: {
        temperature: this.settings.temperature,
        top_p: this.settings.topP,
        num_ctx: this.settings.numCtx,
        num_predict: this.settings.maxTokens,
      },
      keep_alive: this.settings.keepAlive,
    };

    const response = await this.fetchOllama('chat', body);
    const result = await response.json();
    return result.message?.content || '';
  }

  async chatStream(
    messages: any[],
    onChunk: (text: string) => void,
    modelName = 'llama3:latest',
    options: any = {}
  ): Promise<string> {
    const body: Record<string, any> = {
      model: this.activeModel(modelName),
      messages: messages,
      stream: true,
      options: {
        temperature: this.settings.temperature,
        top_p: this.settings.topP,
        num_ctx: this.settings.numCtx,
        num_predict: this.settings.maxTokens,
      },
      keep_alive: this.settings.keepAlive,
    };

    const response = await this.fetchOllama('chat', body);
    if (!response.body) throw new Error('Response body is null — cannot stream');
    return await this.streamNDJSON(response.body, onChunk, true);
  }

  // Embeddings Placeholder
  async embeddings(text: string): Promise<number[]> {
    console.warn('[OllamaProvider] embeddings() is a placeholder.');
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }

  // Vision Placeholder
  async vision(imageBytes: string, prompt: string): Promise<string> {
    console.warn('[OllamaProvider] vision() is a placeholder.');
    return `[Vision Placeholder] Prompt: ${prompt}`;
  }

  // Tool Calling Placeholder
  async toolCalling(tools: any[], prompt: string): Promise<any> {
    console.warn('[OllamaProvider] toolCalling() is a placeholder.');
    return { name: 'placeholder_tool', arguments: { prompt } };
  }

  // NDJSON stream reader — Ollama streams one JSON object per line
  private async streamNDJSON(
    body: ReadableStream<Uint8Array>,
    onChunk: (text: string) => void,
    isChat: boolean
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulated = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            // Check for Ollama error in stream
            if (parsed.error) {
              throw new Error(`Ollama stream error: ${parsed.error}`);
            }
            const text = isChat
              ? (parsed.message?.content ?? '')
              : (parsed.response ?? '');
            if (text) {
              accumulated += text;
              onChunk(text);
            }
          } catch (parseErr: any) {
            if (parseErr.message?.startsWith('Ollama stream error')) {
              throw parseErr;
            }
            // Silently skip malformed partial chunks
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const text = isChat
            ? (parsed.message?.content ?? '')
            : (parsed.response ?? '');
          if (text) {
            accumulated += text;
            onChunk(text);
          }
        } catch {}
      }

      return accumulated;
    } finally {
      reader.releaseLock();
    }
  }
}


export class OpenRouterProvider implements AiProvider {
  private apiKey?: string;
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  async generate(prompt: string, modelName = 'meta-llama/llama-3-8b-instruct:free'): Promise<string> {
    const key = this.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : process.env.OPENROUTER_API_KEY);
    if (!key) throw new Error('API_KEY_MISSING: OpenRouter API key is missing. Please configure it in your Settings.');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://projectforge-ai.com',
        'X-Title': 'ProjectForge AI'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`API_ERROR: OpenRouter request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  }
}

// Highly dynamic Mock AI Provider
export class MockAiProvider implements AiProvider {
  async generate(prompt: string): Promise<string> {
    // Artificial latency to feel premium
    await new Promise(resolve => setTimeout(resolve, 800));

    // Try to inspect the prompt keywords to return dynamic structures
    const pLower = prompt.toLowerCase();

    // 1. Planner Prompt
    if (pLower.includes('roadmap') || pLower.includes('milestones')) {
      const isHospital = pLower.includes('hospital');
      const isEcommerce = pLower.includes('commerce') || pLower.includes('store');
      const isChat = pLower.includes('chat') || pLower.includes('message');

      let overview = 'A custom tailored modular application designed to solve workflow routing and clean state updates.';
      let skills = ['React hooks state binding', 'Modular directory separation', 'SQL index structures routing', 'Security gateways validation'];
      let milestones = [
        { id: 'm1', title: 'Folder Scaffolding & Configs', description: 'Bootstrap workspace, layout configuration parameters, and environment state contexts.', status: 'completed', estimatedHours: 2 },
        { id: 'm2', title: 'Data Schemas Mapping', description: 'Design SQL tables structures, index keys, and database connections pools.', status: 'in-progress', estimatedHours: 3 },
        { id: 'm3', title: 'API Endpoints Scaffold', description: 'Develop REST controllers endpoints and setup validation middleware pipelines.', status: 'todo', estimatedHours: 4 },
        { id: 'm4', title: 'Client Pages Routing', description: 'Assemble core UI page components, context boundaries, and styles bindings.', status: 'todo', estimatedHours: 4 }
      ];

      if (isHospital) {
        overview = 'An educational ERP software system mapping patient records, outpatient appointments, and practitioner shifts schedule metrics.';
        skills = ['React list states rendering', 'Relational SQL queries tuning', 'JWT role base authentications checks', 'Express API handlers'];
        milestones = [
          { id: 'm1', title: 'Core Workspace Bootstrapping', description: 'Set up patient forms, models, and folder assets.', status: 'completed', estimatedHours: 3 },
          { id: 'm2', title: 'Patient database and schedules setup', description: 'Formulate SQL scripts for patients, appointments, and doctors indices.', status: 'in-progress', estimatedHours: 4 },
          { id: 'm3', title: 'REST controller gateways design', description: 'Build endpoints to edit appointments and get active physician schedules.', status: 'todo', estimatedHours: 4 },
          { id: 'm4', title: 'Clinical dashboard UI', description: 'Craft doctor appointment rosters list views and checkin forms.', status: 'todo', estimatedHours: 5 }
        ];
      } else if (isEcommerce) {
        overview = 'A high performance commerce store managing product items lists, user cart states, and checkout invoice triggers.';
        skills = ['Local session states caching', 'Database transactional locking', 'Stripe payment placeholders', 'Zod schema checks'];
        milestones = [
          { id: 'm1', title: 'Folder skeleton and static details', description: 'Initialize directories structure, product list lists, and pricing styles.', status: 'completed', estimatedHours: 2 },
          { id: 'm2', title: 'Relational cart and product database', description: 'Draft products, collections, order, and line items SQL schemas.', status: 'in-progress', estimatedHours: 4 },
          { id: 'm3', title: 'Checkout & Cart API', description: 'Build route controllers to update items amounts and trigger mock invoices.', status: 'todo', estimatedHours: 3 },
          { id: 'm4', title: 'Product Catalog Interface', description: 'Assemble filtering cards, cart drawers, and pricing preview models.', status: 'todo', estimatedHours: 4 }
        ];
      }

      return JSON.stringify({
        overview,
        estimatedTime: isHospital ? '16 Hours' : isEcommerce ? '13 Hours' : '12 Hours',
        xpReward: isHospital ? 1800 : 1200,
        skills,
        objectives: [
          'Understand modern software engineering layered models.',
          'Build secure relational DB tables with foreign keys constraints.',
          'Construct rest routing endpoints with validations checks.',
          'Develop modular component structures to manage complex states.'
        ],
        roadmap: milestones
      });
    }

    // 2. Architecture diagrams
    if (pLower.includes('diagram') || pLower.includes('svg')) {
      const isHospital = pLower.includes('hospital');
      const isEcommerce = pLower.includes('commerce') || pLower.includes('store');

      const sysText = isHospital ? 'Hospital Management API Gateway' : isEcommerce ? 'E-Commerce Gateway' : 'Application API Gateway';
      const dbText = isHospital ? 'Patients / Appointments / Staff DB' : isEcommerce ? 'Products / Orders / Users DB' : 'Config / Records DB';

      const makeSvg = (title: string, detail: string) => `<svg viewBox="0 0 450 160" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
  <rect width="450" height="160" fill="#09090B" rx="10" stroke="#1E293B" stroke-width="1.5"/>
  <rect x="20" y="45" width="100" height="70" fill="#1E1B4B" stroke="#4F46E5" rx="6"/>
  <text x="70" y="75" fill="#F8FAFC" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">Browser Client</text>
  <text x="70" y="95" fill="#818CF8" font-size="8" font-family="sans-serif" text-anchor="middle">UI Web View</text>
  
  <rect x="175" y="45" width="100" height="70" fill="#172554" stroke="#2563EB" rx="6"/>
  <text x="225" y="75" fill="#F8FAFC" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">${title}</text>
  <text x="225" y="95" fill="#60A5FA" font-size="8" font-family="sans-serif" text-anchor="middle">Server Routes</text>

  <rect x="330" y="45" width="100" height="70" fill="#064E3B" stroke="#059669" rx="6"/>
  <text x="380" y="75" fill="#F8FAFC" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">${detail}</text>
  <text x="380" y="95" fill="#34D399" font-size="8" font-family="sans-serif" text-anchor="middle">Storage Engine</text>

  <path d="M 120 80 H 175" fill="none" stroke="#4F46E5" stroke-width="2" marker-end="url(#arrow)"/>
  <path d="M 275 80 H 330" fill="none" stroke="#2563EB" stroke-width="2"/>
</svg>`;

      return JSON.stringify({
        systemDiagram: makeSvg('Web Server Gateway', sysText),
        databaseDiagram: makeSvg('Database Schema Relational', dbText),
        flowDiagram: makeSvg('Authentication Security Flow', 'JSON Web Tokens Verification'),
        componentDiagram: makeSvg('Sub-Component Architecture', 'Context State Management Hub')
      });
    }

    // 3. Database prompt
    if (pLower.includes('dbschemas') || pLower.includes('sql')) {
      const isHospital = pLower.includes('hospital');
      const isEcommerce = pLower.includes('commerce') || pLower.includes('store');

      if (isHospital) {
        return JSON.stringify({
          dbSchemas: [
            {
              table: 'patients',
              columns: [
                { name: 'id', type: 'UUID', key: 'PK', nullable: false },
                { name: 'full_name', type: 'VARCHAR(100)', key: null, nullable: false },
                { name: 'email', type: 'VARCHAR(100)', key: null, nullable: true },
                { name: 'medical_history', type: 'TEXT', key: null, nullable: true }
              ],
              sql: `CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
            },
            {
              table: 'appointments',
              columns: [
                { name: 'id', type: 'UUID', key: 'PK', nullable: false },
                { name: 'patient_id', type: 'UUID', key: 'FK', nullable: false, references: 'patients' },
                { name: 'appointment_date', type: 'TIMESTAMP', key: null, nullable: false },
                { name: 'doctor_notes', type: 'TEXT', key: null, nullable: true }
              ],
              sql: `CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP NOT NULL,
  doctor_notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled'
);`
            }
          ]
        });
      } else if (isEcommerce) {
        return JSON.stringify({
          dbSchemas: [
            {
              table: 'products',
              columns: [
                { name: 'id', type: 'UUID', key: 'PK', nullable: false },
                { name: 'title', type: 'VARCHAR(200)', key: null, nullable: false },
                { name: 'price', type: 'DECIMAL(10,2)', key: null, nullable: false },
                { name: 'inventory_count', type: 'INTEGER', key: null, nullable: false }
              ],
              sql: `CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
            }
          ]
        });
      }

      return JSON.stringify({
        dbSchemas: [
          {
            table: 'configs',
            columns: [
              { name: 'id', type: 'INTEGER', key: 'PK', nullable: false },
              { name: 'config_key', type: 'VARCHAR(50)', key: null, nullable: false },
              { name: 'config_value', type: 'TEXT', key: null, nullable: true }
            ],
            sql: `CREATE TABLE configs (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) NOT NULL UNIQUE,
  config_value TEXT
);`
          }
        ]
      });
    }

    // 4. Folder 구조
    if (pLower.includes('files') || pLower.includes('folder')) {
      const isHospital = pLower.includes('hospital');
      const isEcommerce = pLower.includes('commerce') || pLower.includes('store');

      let fileTree = [];
      if (isHospital) {
        fileTree = [
          {
            name: 'src',
            path: 'src',
            type: 'folder',
            children: [
              {
                name: 'components',
                path: 'src/components',
                type: 'folder',
                children: [
                  {
                    name: 'PatientDashboard.tsx',
                    path: 'src/components/PatientDashboard.tsx',
                    type: 'file',
                    content: `import React, { useState } from 'react';

export default function PatientDashboard() {
  const [patients, setPatients] = useState([
    { id: '1', name: 'John Doe', condition: 'Routine Checkup' },
    { id: '2', name: 'Alice Smith', condition: 'Cardiology Review' }
  ]);

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 text-white rounded-xl">
      <h3 className="text-lg font-bold text-indigo-400">Clinical Patient List</h3>
      <ul className="mt-4 space-y-2">
        {patients.map(p => (
          <li key={p.id} className="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between">
            <span>{p.name}</span>
            <span className="text-gray-400 text-xs">{p.condition}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}`
                  }
                ]
              },
              {
                name: 'server.js',
                path: 'src/server.js',
                type: 'file',
                content: `const express = require('express');
const app = express();
app.use(express.json());

const appointments = [];

app.post('/api/appointments', (req, res) => {
  const { patientId, date } = req.body;
  if (!patientId || !date) {
    return res.status(400).json({ error: 'patientId and date are required' });
  }
  const newAppointment = { id: appointments.length + 1, patientId, date, status: 'scheduled' };
  appointments.push(newAppointment);
  res.status(201).json(newAppointment);
});

app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.listen(3001, () => console.log('Hospital API running on 3001'));`
              }
            ]
          }
        ];
      } else {
        fileTree = [
          {
            name: 'src',
            path: 'src',
            type: 'folder',
            children: [
              {
                name: 'index.tsx',
                path: 'src/index.tsx',
                type: 'file',
                content: `import React from 'react';

export default function Home() {
  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen">
      <h2 className="text-xl font-bold text-indigo-400">Project Scaffolding Success</h2>
      <p className="text-xs text-slate-400 mt-2">Ready to implement business modules.</p>
    </div>
  );
}`
              }
            ]
          }
        ];
      }

      return JSON.stringify({ files: fileTree });
    }

    // 5. API specs
    if (pLower.includes('apidocs') || pLower.includes('endpoints')) {
      const isHospital = pLower.includes('hospital');

      if (isHospital) {
        return JSON.stringify({
          apiDocs: [
            {
              method: 'POST',
              endpoint: '/api/appointments',
              description: 'Schedule a new medical appointment for a patient',
              headers: { 'Content-Type': 'application/json' },
              requestBody: '{\n  "patientId": "p-uuid-98213",\n  "date": "2026-07-06T10:00:00Z"\n}',
              responseBody: '{\n  "id": "app-uuid-56431",\n  "patientId": "p-uuid-98213",\n  "date": "2026-07-06T10:00:00Z",\n  "status": "scheduled"\n}',
              statusCodes: [
                { code: 201, description: 'Appointment scheduled successfully.' },
                { code: 400, description: 'Missing required parameters.' }
              ]
            },
            {
              method: 'GET',
              endpoint: '/api/patients',
              description: 'Retrieve list of all active patients records',
              headers: { 'Authorization': 'Bearer <token>' },
              requestBody: null,
              responseBody: '[\n  {\n    "id": "p-uuid-98213",\n    "fullName": "John Doe",\n    "email": "john.doe@example.com"\n  }\n]',
              statusCodes: [
                { code: 200, description: 'Success' }
              ]
            }
          ]
        });
      }

      return JSON.stringify({
        apiDocs: [
          {
            method: 'GET',
            endpoint: '/api/status',
            description: 'Check status monitor parameters',
            responseBody: '{\n  "status": "online",\n  "database": "connected"\n}',
            statusCodes: [{ code: 200, description: 'Online' }]
          }
        ]
      });
    }

    // 6. Lessons prompt
    if (pLower.includes('lessons') || pLower.includes('theory')) {
      const isHospital = pLower.includes('hospital');
      const targetPath = isHospital ? 'src/components/PatientDashboard.tsx' : 'src/index.tsx';

      return JSON.stringify({
        lessons: [
          {
            id: 'l1',
            title: isHospital ? 'Structuring Medical App Data Layers' : 'Building Decentralized Code Layouts',
            objective: isHospital ? 'Connect patients data to lists component views safely.' : 'Isolate component layers from global config contexts.',
            explanation: 'When building enterprise grade layout systems, keeping details structured enables quick rendering and prevents memory leaks.',
            theory: 'Layered architectures partition roles cleanly. The view layer displays user actions, while route gateways compute endpoints, keeping the data storage decoupled.',
            code: `// Scalable configurations details:\nconst config = {\n  env: 'production',\n  timeout: 5000\n};`,
            path: targetPath,
            whyWeDoThis: 'Splitting presentation from calculation simplifies testing. Individual layouts can be mocked and rendered separately without booting up server runtimes.',
            commonMistakes: [
              'Declaring global database references directly in front-end react state loops.',
              'Ignoring component cleanup rules on route redirects.'
            ],
            bestPractices: [
              'Separate concerns inside standalone hooks.',
              'Use env variables instead of hardcoded strings.'
            ],
            quiz: [
              {
                id: 'q1',
                question: 'Which tier should handle secret environment key tokens?',
                options: ['React Front-End UI Component', 'CSS Rules', 'Server API Route Controllers', 'Docker Compose files'],
                correctAnswer: 2,
                explanation: 'Server API route controllers compile on secure node runtimes, protecting API credentials from customer inspection.'
              }
            ],
            challenge: {
              title: 'Add a new settings variable',
              instructions: 'Extend the config dictionary constant by adding a boolean toggle key named debugMode.',
              initialCode: `const config = {
  env: 'production'
};`,
              solution: `const config = {
  env: 'production',
  debugMode: true
};`
            },
            completed: false
          }
        ]
      });
    }

    // 7. Career boost / Resume prompt
    if (pLower.includes('resumebulletpoints') || pLower.includes('interviewquestions')) {
      return JSON.stringify({
        resumeBulletPoints: [
          'Engineered highly optimized queries using custom SQL database indexes, reducing page loads by 35% on average.',
          'Constructed responsive multi-step interactive dashboards using React and Tailwind CSS, increasing client onboarding satisfaction scores by 25%.',
          'Architected a RESTful API routing architecture with JWT authentication, securing access control across medical and billing endpoints.'
        ],
        linkedinDescription: `🚀 I just launched a new custom software build! \n\nFeatures custom layered components, robust relational database tables with index keys, and scalable REST API controllers routing. I built this to master secure system architectures. Check out ProjectForge AI to build yours! #React #NodeJS #SoftwareArchitecture`,
        interviewQuestions: [
          {
            question: 'How do you prevent SQL Injection attacks when writing queries for database connectors?',
            answer: 'Use parameterized queries or prepared statements. This ensures the database driver separates SQL command tokens from user input data instead of string concat.',
            topic: 'Security'
          },
          {
            question: 'What is the advantage of using a Client Context state provider versus prop drilling?',
            answer: 'Context providers enable sharing global parameters (such as theme configuration or auth profile data) to nested child components without passing variables through every level.',
            topic: 'React State Management'
          }
        ]
      });
    }

    // 8. Documentation README prompt
    if (pLower.includes('readme')) {
      return JSON.stringify({
        readme: `# Modular Codebase Workspace

This project was dynamically generated by the ProjectForge AI Software Engineering Mentor.

## Features
- **Relational Schemas** mapping DB components cleanly.
- **REST route controllers** implementing API actions.
- **Interactive lessons** guiding implementation steps.

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
`
      });
    }

    return JSON.stringify({ explanation: 'MOCK AI RESPONSE: I am the mock AI mentor. You requested to analyze or explain this code. In a real environment, I would provide a detailed architectural breakdown of this component.' });
  }
}
