const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { GET, POST } = require('../.test-build/route.js');
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
after(() => { global.fetch = originalFetch; process.env = originalEnv; });

function configure() {
  Object.assign(process.env, {
    APPLICATION_INTAKE_ENABLED: 'true', RESEND_API_KEY: 'test-only',
    APPLICATION_FROM_EMAIL: 'recruiting@example.com', APPLICATION_TO_EMAIL: 'test@example.com',
    AIRTABLE_ACCESS_TOKEN: 'test-only', AIRTABLE_BASE_ID: 'appTest', AIRTABLE_TABLE_ID: 'tblTest',
  });
}
function request(overrides = {}, origin = 'https://example.com') {
  const form = new FormData();
  const data = { firstName: 'Synthetic', lastName: 'Applicant', email: 'applicant@example.com',
    phone: '202-555-0100', state: 'CA', adult: 'Yes', licenseType: 'Not licensed',
    willingToLicense: 'Yes', privacyAcknowledged: 'yes', ...overrides };
  for (const [k, v] of Object.entries(data)) form.set(k, v);
  form.set('resume', new File(['%PDF-test-only'], 'synthetic.pdf', { type: 'application/pdf' }));
  return new Request('https://example.com/api/applications', { method: 'POST', headers: { origin }, body: form });
}
function provider({ fail = '', existing = false, sent = false } = {}) {
  const calls = [];
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, options, body });
    const stage = url.includes('content.airtable') ? 'upload' : url.includes('resend') ? 'email' : body.performUpsert ? 'record' : 'status';
    if (stage === fail) return Response.json({ error: 'test error' }, { status: 503 });
    const attachment = { filename: 'synthetic.pdf', size: 14 };
    if (stage === 'record') return Response.json({ records: [{ id: 'recSynthetic', fields: {
      ...(existing ? { Attachments: [attachment] } : {}), ...(sent ? { 'Email delivery status': 'Sent' } : {}),
    } }] });
    if (stage === 'upload') return Response.json({ id: 'recSynthetic', fields: { fldAttachment: [attachment] } });
    return Response.json({ id: 'test' });
  };
  return calls;
}

test('disabled until both providers and explicit flag are configured', async () => {
  configure(); delete process.env.AIRTABLE_ACCESS_TOKEN;
  const calls = provider();
  assert.equal((await (await GET()).json()).enabled, false);
  assert.equal((await POST(request())).status, 503);
  assert.equal(calls.length, 0);
});
test('unlicensed answers, no SMS consent, private upload and preserved email attachment', async () => {
  configure(); const calls = provider();
  assert.equal((await POST(request())).status, 200);
  assert.equal(calls.length, 4);
  const fields = calls[0].body.records[0].fields;
  assert.equal(fields['Recruiting SMS consent'], 'No');
  assert.equal(fields['Willing to get licensed within 2 weeks'], 'Yes');
  assert.equal(fields['Needs carrier releases'], undefined);
  assert.equal(fields['Last employment date as an insurance agent'], undefined);
  assert.equal(fields.Name, 'Synthetic Applicant');
  assert.match(fields['Application submission ID'], /^[a-f0-9]{64}$/);
  assert.equal(calls[1].url, 'https://content.airtable.com/v0/appTest/recSynthetic/Attachments/uploadAttachment');
  assert.equal(calls[1].body.file, Buffer.from('%PDF-test-only').toString('base64'));
  assert.equal(calls[1].body.url, undefined);
  assert.equal(calls[2].body.attachments[0].content, calls[1].body.file);
  assert.equal(calls[2].options.headers['Idempotency-Key'], 'application-' + fields['Application submission ID']);
});
test('licensed branch excludes hidden unlicensed answer and captures consent', async () => {
  configure(); const calls = provider();
  assert.equal((await POST(request({ licenseType: 'Both health and life', needsReleases: 'No', lastEmploymentDate: '2025-01-31', smsConsent: 'yes' }))).status, 200);
  const f = calls[0].body.records[0].fields;
  assert.equal(f['Willing to get licensed within 2 weeks'], undefined);
  assert.equal(f['Needs carrier releases'], 'No');
  assert.equal(f['Recruiting SMS consent'], 'Yes');
});
test('retry reuses existing attachment and skips already sent email', async () => {
  configure(); const calls = provider({ existing: true, sent: true });
  assert.equal((await POST(request())).status, 200);
  assert.equal(calls.length, 1);
});
test('email retry reuses attachment and the same idempotency key', async () => {
  configure(); let calls = provider({ existing: true, fail: 'email' });
  assert.equal((await POST(request())).status, 502);
  const key = calls[1].options.headers['Idempotency-Key'];
  calls = provider({ existing: true });
  assert.equal((await POST(request())).status, 200);
  assert.equal(calls[1].options.headers['Idempotency-Key'], key);
  assert.equal(calls.some(c => c.url.includes('content.airtable')), false);
});
test('provider failures never return false success', async () => {
  configure();
  for (const fail of ['record', 'upload', 'email', 'status']) {
    provider({ fail });
    assert.equal((await POST(request())).status, 502, fail);
  }
});
test('invalid dates, consent and origins cause no provider traffic', async () => {
  configure(); const calls = provider();
  assert.equal((await POST(request({ licenseType: 'Health', needsReleases: 'Yes', lastEmploymentDate: '2025-02-31' }))).status, 400);
  assert.equal((await POST(request({ privacyAcknowledged: '' }))).status, 400);
  assert.equal((await POST(request({}, 'https://attacker.example'))).status, 403);
  assert.equal(calls.length, 0);
});
