import { describe, expect, it } from 'vitest';
import { formatBytes, prettyBody, truncate } from '../src/lib/format';
import { highlightJson } from '../src/lib/highlight';

describe('formatBytes', () => {
  it('scales across units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
  });
});

describe('prettyBody', () => {
  it('pretty-prints json detected by content type', () => {
    expect(prettyBody('{"a":1}', 'application/json')).toBe('{\n  "a": 1\n}');
  });

  it('pretty-prints json detected by shape', () => {
    expect(prettyBody('{"a":1}', null)).toBe('{\n  "a": 1\n}');
  });

  it('leaves non-json untouched', () => {
    expect(prettyBody('a=1&b=2', 'application/x-www-form-urlencoded')).toBe('a=1&b=2');
  });

  it('returns empty string for an empty body', () => {
    expect(prettyBody('', 'application/json')).toBe('');
  });

  it('falls back to raw text on malformed json', () => {
    expect(prettyBody('{not json}', 'application/json')).toBe('{not json}');
  });
});

describe('truncate', () => {
  it('adds an ellipsis only when needed', () => {
    expect(truncate('abcdef', 3)).toBe('abc…');
    expect(truncate('abc', 6)).toBe('abc');
  });
});

describe('highlightJson', () => {
  it('escapes html so captured payloads cannot inject markup', () => {
    const output = highlightJson('{"evil":"<script>alert(1)</script>"}');
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('annotates keys, strings, numbers and booleans', () => {
    const output = highlightJson('{"n":42,"ok":true,"nil":null}');
    expect(output).toContain('class="json-key"');
    expect(output).toContain('class="json-number"');
    expect(output).toContain('class="json-bool"');
    expect(output).toContain('class="json-null"');
  });
});
