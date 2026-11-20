import { parseJsonFromLlm } from './llm-json.js';

describe('parseJsonFromLlm', () => {
  it('parses a bare JSON array', () => {
    expect(parseJsonFromLlm('[{"a":1}]')).toEqual([{ a: 1 }]);
  });

  it('strips a json code fence', () => {
    expect(parseJsonFromLlm('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
  });

  it('strips an unlabelled code fence', () => {
    expect(parseJsonFromLlm('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('returns null for malformed JSON rather than throwing', () => {
    expect(parseJsonFromLlm('not json at all')).toBeNull();
    expect(parseJsonFromLlm('[{"a":')).toBeNull();
  });

  it('returns null for empty or missing input', () => {
    expect(parseJsonFromLlm(null)).toBeNull();
    expect(parseJsonFromLlm('')).toBeNull();
    expect(parseJsonFromLlm('```\n\n```')).toBeNull();
  });
});
