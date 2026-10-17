// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { aiModelId, AiNotConfiguredError, requireModel } from '@/ai/genkit';

describe('the model id comes from AI_MODEL_ID only', () => {
  it('trims it, and an empty value means "not configured"', () => {
    expect(aiModelId({ AI_MODEL_ID: '  some-flash-model  ' })).toBe('some-flash-model');
    expect(aiModelId({})).toBe('');
    expect(() => requireModel({})).toThrow(AiNotConfiguredError);
    expect(() => requireModel({ AI_MODEL_ID: '   ' })).toThrow(AiNotConfiguredError);
  });
  it('builds a model reference from whatever id is set (no id is written in the code)', () => {
    const a: any = requireModel({ AI_MODEL_ID: 'gemini-flash-test-a' });
    const b: any = requireModel({ AI_MODEL_ID: 'gemini-flash-test-b' });
    expect(JSON.stringify(a)).toContain('gemini-flash-test-a');
    expect(JSON.stringify(b)).toContain('gemini-flash-test-b');
  });
});
