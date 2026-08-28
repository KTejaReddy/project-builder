/**
 * Robust JSON parser for AI-generated output.
 * Handles: preamble text, markdown fences, nested JSON strings,
 * trailing commas, unclosed brackets, and escaped structures.
 */

// ─── Noise stripping ──────────────────────────────────────────────────────────

export function cleanJsonString(raw: string): string {
  let s = raw ?? '';
  s = s.trim();

  // If it already looks like pure JSON, don't run aggressive preamble regexes
  if (s.startsWith('{') || s.startsWith('[')) {
    return s;
  }

  // Strip DeepSeek / Qwen reasoning tags
  s = s.replace(/<think[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown fences: ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json|javascript|js|ts|typescript)?\s*/im, '');
  s = s.replace(/```\s*$/im, '');
  s = s.trim();

  // Only run preamble stripping if it still doesn't start with { or [
  if (!s.startsWith('{') && !s.startsWith('[')) {
    // Strip common AI preamble lines (before the JSON starts)
    s = s.replace(
      /^[\s\S]*?(?:here\s+is|here's|below\s+is|the\s+(?:json|response|output)\s*(?:is|:)|response\s*:|output\s*:|result\s*:)[^\n]*\n/i,
      ''
    ).trim();
  }

  return s;
}

// ─── Repair common malformed JSON ────────────────────────────────────────────

export function repairJSON(s: string): string {
  // Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // Replace single-quoted strings with double-quoted (common model mistake)
  // Only if the string doesn't already have double quotes
  s = s.replace(/:\s*'([^']*?)'/g, ': "$1"');

  // Fix unquoted keys: { key: value } → { "key": value }
  s = s.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Attempt to close unclosed objects/arrays at end of string
  const openBraces = (s.match(/\{/g) || []).length;
  const closeBraces = (s.match(/\}/g) || []).length;
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;

  // Only add closers if they're trailing (avoid corrupting balanced structures)
  if (closeBrackets < openBrackets) s = s + ']'.repeat(openBrackets - closeBrackets);
  if (closeBraces < openBraces) s = s + '}'.repeat(openBraces - closeBraces);

  return s;
}

// ─── 5-strategy JSON extraction ──────────────────────────────────────────────

export function extractJSON(raw: string): string | null {
  const cleaned = cleanJsonString(raw);

  let lastError: Error | null = null;

  // Strategy 1: direct parse
  try { 
    JSON.parse(cleaned); 
    return cleaned; 
  } catch (err: any) {
    lastError = err;
    console.warn(`[AI Parser] Direct parse failed: ${err.message}`);
  }

  // Strategy 2: extract first {...} block via indexOf/lastIndexOf
  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    const frag = cleaned.slice(objStart, objEnd + 1);
    try { 
      JSON.parse(frag); 
      return frag; 
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Parser] Strategy 2 {...} failed: ${err.message}`);
    }

    // Strategy 3a: repair the {...} fragment
    const repaired = repairJSON(frag);
    try { 
      JSON.parse(repaired); 
      return repaired; 
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Parser] Strategy 3a repaired {...} failed: ${err.message}`);
    }
  }

  // Strategy 4: extract first [...] block
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    const frag = cleaned.slice(arrStart, arrEnd + 1);
    try { 
      JSON.parse(frag); 
      return frag; 
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Parser] Strategy 4 [...] failed: ${err.message}`);
    }
  }

  // Strategy 5: balanced bracket scan — walk from first { counting depth
  for (const openChar of ['{', '['] as const) {
    const closeChar = openChar === '{' ? '}' : ']';
    const start = cleaned.indexOf(openChar);
    if (start === -1) continue;
    let depth = 0, inString = false, escape = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          const frag = cleaned.slice(start, i + 1);
          try { 
            JSON.parse(frag); 
            return frag; 
          } catch (err: any) {
            console.warn(`[AI Parser] Strategy 5 scan failed: ${err.message}`);
            const repaired = repairJSON(frag);
            try { 
              JSON.parse(repaired); 
              return repaired; 
            } catch (err2: any) {
              console.warn(`[AI Parser] Strategy 5 repaired scan failed: ${err2.message}`);
            }
            break;
          }
        }
      }
    }
  }

  console.error(`[AI Parser] All extraction strategies failed. Last error: ${lastError?.message}`);
  return null;
}

// ─── Nested JSON-string unpacker ─────────────────────────────────────────────

/**
 * Models sometimes return objects with values that are JSON-encoded strings:
 *   "responseBody": "[{\"id\":1}]"   ← wrong
 *   "responseBody": [{"id":1}]       ← correct
 *
 * This walks the parsed object tree and replaces string values that are
 * valid JSON objects/arrays with their parsed equivalents.
 */
export function unpackNestedJSONStrings(value: any, depth = 0): any {
  if (depth > 5) return value; // guard against infinite recursion

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        // Recursively unpack nested strings within the parsed value
        return unpackNestedJSONStrings(parsed, depth + 1);
      } catch (_) {}
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => unpackNestedJSONStrings(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = unpackNestedJSONStrings(v, depth + 1);
    }
    return result;
  }

  return value;
}

// ─── Safe parse with fallback ─────────────────────────────────────────────────

export function safeParseJSON<T>(raw: string, fallback: T): T {
  console.log('[AI Parser] Raw response length:', raw?.length ?? 0);
  console.log('[AI Parser] Raw response preview:', raw?.substring(0, 300));

  if (!raw || !raw.trim()) {
    console.warn('[AI Parser] Empty response — using fallback');
    return fallback;
  }

  const extracted = extractJSON(raw);

  if (!extracted) {
    console.error('[AI Parser] Could not extract JSON. Raw:', raw.substring(0, 500));
    return fallback;
  }

  try {
    const parsed = JSON.parse(extracted);
    const unpacked = unpackNestedJSONStrings(parsed);
    console.log('[AI Parser] ✓ Successfully parsed and unpacked JSON');
    return unpacked as T;
  } catch (err) {
    console.error('[AI Parser] JSON.parse failed:', err);
    console.error('[AI Parser] Fragment was:', extracted.substring(0, 300));
    return fallback;
  }
}

// ─── Schema validation ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
  invalidFields: string[];
  errors: string[];
}

type FieldRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;       // for arrays
  nonEmpty?: boolean;       // for strings/arrays
};

type Schema = Record<string, FieldRule>;

export function validateSchema(data: any, schema: Schema, context = 'root'): ValidationResult {
  const result: ValidationResult = { valid: true, missingFields: [], invalidFields: [], errors: [] };

  if (!data || typeof data !== 'object') {
    result.valid = false;
    result.errors.push(`${context}: expected object, got ${typeof data}`);
    return result;
  }

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const path = `${context}.${field}`;

    // Required check
    if (rule.required && (value === undefined || value === null)) {
      result.valid = false;
      result.missingFields.push(path);
      result.errors.push(`${path}: MISSING (required)`);
      continue;
    }

    if (value === undefined || value === null) continue; // optional field absent — ok

    // Type check
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        result.valid = false;
        result.invalidFields.push(path);
        result.errors.push(`${path}: expected ${rule.type}, got ${actualType} (value: ${JSON.stringify(value).substring(0, 50)})`);
        continue;
      }
    }

    // Array min length
    if (rule.minLength !== undefined && Array.isArray(value) && value.length < rule.minLength) {
      result.valid = false;
      result.invalidFields.push(path);
      result.errors.push(`${path}: array has ${value.length} items, minimum is ${rule.minLength}`);
    }

    // Non-empty check
    if (rule.nonEmpty) {
      if ((typeof value === 'string' && !value.trim()) ||
          (Array.isArray(value) && value.length === 0)) {
        result.valid = false;
        result.invalidFields.push(path);
        result.errors.push(`${path}: must not be empty`);
      }
    }
  }

  return result;
}

// ─── Per-step schemas ─────────────────────────────────────────────────────────

export const SCHEMAS = {
  planner: {
    overview:      { required: true, type: 'string', nonEmpty: true },
    estimatedTime: { required: true, type: 'string', nonEmpty: true },
    xpReward:      { required: true, type: 'number' },
    skills:        { required: true, type: 'array',  minLength: 1 },
    objectives:    { required: true, type: 'array',  minLength: 1 },
    roadmap:       { required: true, type: 'array',  minLength: 1 },
  } as Schema,

  architecture: {
    systemDiagram:    { required: true, type: 'string', nonEmpty: true },
    databaseDiagram:  { required: true, type: 'string', nonEmpty: true },
    flowDiagram:      { required: true, type: 'string', nonEmpty: true },
    componentDiagram: { required: true, type: 'string', nonEmpty: true },
  } as Schema,

  database: {
    dbSchemas: { required: true, type: 'array', minLength: 1 },
  } as Schema,

  folder: {
    files: { required: true, type: 'array', minLength: 1 },
  } as Schema,

  api: {
    apiDocs: { required: true, type: 'array', minLength: 1 },
  } as Schema,

  lesson: {
    lessons: { required: true, type: 'array', minLength: 1 },
  } as Schema,

  career: {
    resumeBulletPoints:  { required: true, type: 'array',  minLength: 1 },
    linkedinDescription: { required: true, type: 'string', nonEmpty: true },
    interviewQuestions:  { required: true, type: 'array',  minLength: 1 },
  } as Schema,

  documentation: {
    readme: { required: true, type: 'string', nonEmpty: true },
  } as Schema,
} as const;

// ─── JSON Schema Generator ──────────────────────────────────────────────────

export function convertToJSONSchema(schemaKey: string): any {
  const customSchema = SCHEMAS[schemaKey as keyof typeof SCHEMAS];
  if (!customSchema) return { type: 'object' };

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [field, rule] of Object.entries(customSchema)) {
    const fieldRule = rule as any;
    let type: string = fieldRule.type || 'string';
    let itemSchema: any = undefined;

    if (type === 'array') {
      if (['skills', 'objectives', 'suggestions', 'strengths', 'weaknesses', 'recommendations'].includes(field)) {
        itemSchema = { type: 'string' };
      } else if (field === 'roadmap') {
        itemSchema = {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            estimatedHours: { type: 'number' }
          },
          required: ['id', 'title', 'description', 'status', 'estimatedHours']
        };
      } else if (field === 'dbSchemas') {
        itemSchema = {
          type: 'object',
          properties: {
            table: { type: 'string' },
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  key: { type: ['string', 'null'] },
                  nullable: { type: 'boolean' },
                  references: { type: ['string', 'null'] }
                },
                required: ['name', 'type', 'nullable']
              }
            },
            sql: { type: 'string' }
          },
          required: ['table', 'columns', 'sql']
        };
      } else if (field === 'files') {
        itemSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            path: { type: 'string' },
            type: { type: 'string' },
            content: { type: 'string' },
            children: { type: 'array' }
          },
          required: ['name', 'path', 'type']
        };
      } else if (field === 'apiDocs') {
        itemSchema = {
          type: 'object',
          properties: {
            method: { type: 'string' },
            endpoint: { type: 'string' },
            description: { type: 'string' },
            headers: { type: 'object' },
            requestBody: { type: ['object', 'null'] },
            responseBody: { type: 'object' },
            statusCodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'number' },
                  description: { type: 'string' }
                },
                required: ['code', 'description']
              }
            }
          },
          required: ['method', 'endpoint', 'description', 'responseBody', 'statusCodes']
        };
      } else if (field === 'lessons') {
        itemSchema = {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            objective: { type: 'string' },
            explanation: { type: 'string' },
            theory: { type: 'string' },
            code: { type: 'string' },
            path: { type: 'string' },
            whyWeDoThis: { type: 'string' },
            commonMistakes: { type: 'array', items: { type: 'string' } },
            bestPractices: { type: 'array', items: { type: 'string' } },
            quiz: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correctAnswer: { type: 'number' },
                  explanation: { type: 'string' }
                },
                required: ['id', 'question', 'options', 'correctAnswer', 'explanation']
              }
            },
            challenge: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                instructions: { type: 'string' },
                initialCode: { type: 'string' },
                solution: { type: 'string' }
              },
              required: ['title', 'instructions', 'initialCode', 'solution']
            },
            completed: { type: 'boolean' }
          },
          required: ['id', 'title', 'objective', 'explanation', 'theory', 'code', 'path', 'quiz', 'challenge', 'completed']
        };
      } else if (field === 'interviewQuestions') {
        itemSchema = {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            topic: { type: 'string' }
          },
          required: ['question', 'answer', 'topic']
        };
      } else {
        itemSchema = { type: 'string' };
      }
    }

    properties[field] = {
      type,
      ...(itemSchema ? { items: itemSchema } : {})
    };

    if (fieldRule.required) {
      required.push(field);
    }
  }

  return {
    type: 'object',
    properties,
    required
  };
}

// ─── Field validator ──────────────────────────────────────────────────────────

export function validateField<T>(value: any, validator: (v: any) => boolean, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  try {
    return validator(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
