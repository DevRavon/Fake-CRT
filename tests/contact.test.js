import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';

function response() {
  return {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
}
const valid = {name:'Ray',email:'ray@example.com',subject:'Hello',message:'Let us talk.',website:''};
test('rejects invalid submissions without sending', async () => {
  const res=response();
  await handler({method:'POST',headers:{},body:{...valid,email:'invalid'}},res);
  assert.equal(res.code,400);
});
test('does not report delivery when the server is unconfigured', async () => {
  const res=response(), previous=process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  await handler({method:'POST',headers:{},body:valid},res);
  assert.equal(res.code,503);
  if(previous)process.env.RESEND_API_KEY=previous;
});
test('escapes visitor input and sends only on successful delivery', async () => {
  const oldFetch=globalThis.fetch;
  const oldKey=process.env.RESEND_API_KEY, oldFrom=process.env.RESEND_FROM_EMAIL;
  process.env.RESEND_API_KEY='test-key';process.env.RESEND_FROM_EMAIL='Ravon <contact@ravon.dev>';
  let payload;
  globalThis.fetch=async (_url,options)=>{payload=JSON.parse(options.body);return {ok:true,status:200};};
  try {
    const res=response();
    await handler({method:'POST',headers:{},body:{...valid,message:'<script>alert(1)</script>'}},res);
    assert.equal(res.code,200);
    assert.match(payload.html,/&lt;script&gt;/);
    assert.equal(payload.reply_to,'ray@example.com');
  } finally {
    globalThis.fetch=oldFetch;
    if(oldKey)process.env.RESEND_API_KEY=oldKey;else delete process.env.RESEND_API_KEY;
    if(oldFrom)process.env.RESEND_FROM_EMAIL=oldFrom;else delete process.env.RESEND_FROM_EMAIL;
  }
});
