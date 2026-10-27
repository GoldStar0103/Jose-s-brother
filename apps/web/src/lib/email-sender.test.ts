import { describe, expect, it } from 'vitest';
import {
  buildEmailSender,
  ConsoleEmailSender,
  SmtpEmailSender,
  smtpEnvelopeAddress,
  smtpFromHeader,
} from './email-sender.js';

describe('buildEmailSender', () => {
  it('falls back to the console sender when SMTP is unset outside production', () => {
    const sender = buildEmailSender({ NODE_ENV: 'test' });
    expect(sender).toBeInstanceOf(ConsoleEmailSender);
  });

  it('throws in production when SMTP is missing', () => {
    expect(() => buildEmailSender({ NODE_ENV: 'production' })).toThrow(/SMTP_HOST/);
  });

  it('builds an SMTP sender when the mailbox is configured', () => {
    const sender = buildEmailSender({
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'noreply@monkei.mx',
      SMTP_PASS: 'secret',
      SMTP_FROM: 'Monkei <noreply@monkei.mx>',
    });
    expect(sender).toBeInstanceOf(SmtpEmailSender);
  });
});

describe('smtpEnvelopeAddress', () => {
  it('keeps a bare mailbox', () => {
    expect(smtpEnvelopeAddress('noreply@monkei.mx')).toBe('noreply@monkei.mx');
  });

  it('pulls the mailbox out of a display-name From', () => {
    expect(smtpEnvelopeAddress('Monkei <noreply@monkei.mx>')).toBe('noreply@monkei.mx');
  });

  it('rejects junk so MAIL FROM cannot be sent as <Monkei <addr>>', () => {
    expect(() => smtpEnvelopeAddress('not-an-email')).toThrow(/not a mailbox/);
  });
});

describe('smtpFromHeader', () => {
  it('wraps a bare mailbox in the configured brand name', () => {
    expect(
      smtpFromHeader('noreply@monkei.mx', { NODE_ENV: 'test', LEGAL_BUSINESS_NAME: 'MONKEI' }),
    ).toBe('MONKEI <noreply@monkei.mx>');
  });

  it('falls back to a generic placeholder when no brand name is configured', () => {
    // Never a real store's name — this codebase gets cloned for a new store,
    // and a hardcoded one here would leak whichever store it came from.
    expect(smtpFromHeader('noreply@example.com', { NODE_ENV: 'test' })).toBe(
      'Mi Tienda <noreply@example.com>',
    );
  });

  it('leaves a display-name From alone', () => {
    expect(smtpFromHeader('Monkei <noreply@monkei.mx>')).toBe('Monkei <noreply@monkei.mx>');
  });
});
