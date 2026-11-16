import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cleanText,
  formatCurrency,
  generateGiftCardCode,
  generateSafeId,
  isValidEmail,
  isValidId,
  LIMITS,
} from '../lib/validation';

describe('Blueprint Validation Utilities', () => {
  it('validates document IDs strictly against ^[a-zA-Z0-9_\\-]+$ and maxLength', () => {
    expect(isValidId('prod_abc123-XYZ')).toBe(true);
    expect(isValidId('KING-AB12-CD34')).toBe(true);
    expect(isValidId('')).toBe(false);
    expect(isValidId('bad/path')).toBe(false);
    expect(isValidId('bad id with spaces')).toBe(false);
    expect(isValidId('a'.repeat(LIMITS.idMax + 1))).toBe(false);
  });

  it('validates email format and enforces length cap', () => {
    expect(isValidEmail('buyer@de-king.store')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail(`${'a'.repeat(160)}@x.com`)).toBe(false);
  });

  it('truncates and trims strings to blueprint maxLength', () => {
    expect(cleanText('  hello world  ', 5)).toBe('hello');
    expect(cleanText('x'.repeat(200), LIMITS.productTitleMax).length).toBe(LIMITS.productTitleMax);
  });

  it('generates valid safe IDs and gift card codes', () => {
    const id = generateSafeId('ord');
    expect(isValidId(id)).toBe(true);
    expect(id.startsWith('ord_')).toBe(true);

    const code = generateGiftCardCode();
    expect(code).toMatch(/^KING-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('formats currencies deterministically', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
    expect(formatCurrency(15000, 'TZS')).toContain('15,000');
  });
});

describe('Firestore Blueprint & Rules Synchronization', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const blueprint = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'firebase-blueprint.json'), 'utf8')
  ) as { firestore: Record<string, unknown> };
  const rules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');

  it('includes a global default-deny catch-all rule', () => {
    expect(rules).toContain('match /{document=**}');
    expect(rules).toContain('allow read, write: if false;');
  });

  it('enforces email_verified check for standard writes and bootstrapped admin', () => {
    expect(rules).toContain('request.auth.token.email_verified == true');
    expect(rules).toContain('lupinstarnley009@gmail.com');
  });

  it('keeps auditLogs immutable (no update or delete)', () => {
    const auditSection = rules.slice(rules.indexOf('match /auditLogs/{logId}'));
    expect(auditSection).toContain('allow update: if false;');
    expect(auditSection).toContain('allow delete: if false;');
  });

  it('contains security rule match blocks for every top-level blueprint collection', () => {
    const collections = Object.keys(blueprint.firestore).map((p) => p.split('/')[1]);
    for (const col of new Set(collections)) {
      expect(rules).toContain(`match /${col}/`);
    }
  });
});
