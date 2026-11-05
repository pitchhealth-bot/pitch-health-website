const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAnswers, pruneAnswers, visible, fields, MODE_ID, QUICK, DETAILED } = require(process.env.SURVEY_TEST_BUILD + '/survey/survey-schema.js');
const { GET, POST } = require(process.env.SURVEY_TEST_BUILD + '/api/survey/route.js');
const name = 'fldFzcaCukYELruv4', experience = 'fldsxlwu6O1JOs7nl', optionalPhone = 'fldjZCvIFfAzVZpw8', requiredPhone = 'fld3KLl1TFY1YMH8f';
const quick = { [name]: 'TEST ONLY', [experience]: 'Customer Service Experience', [MODE_ID]: QUICK };
const detailed = { ...quick, [MODE_ID]: DETAILED, flduBS3r98nGEwFwE:'Not applicable.', fldlgIvwmQ3qSv6jQ:'Not applicable.', fldYE2a5uDKiluG1l:"I'm not sure.", fldsIHH5KAyV1oQio:['Other'] };
const request = (data, origin='http://localhost') => new Request('http://localhost/api/survey',{ method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data) });
test('quick uses exact schema field IDs and discards unknown and hidden detailed data',()=>{
 const result=validateAnswers({...quick, fld4bY8G2HxnogbGe:'Satisfied', arbitrary:'bad'});
 assert.deepEqual(result.fields,quick);
});
test('detailed requires explanation, comfort, coverage and at least one issue',()=>{
 assert.ok(validateAnswers({...quick,[MODE_ID]:DETAILED}).error);
 assert.ok(validateAnswers(detailed).fields);
 assert.ok(validateAnswers({...detailed,fldsIHH5KAyV1oQio:[]}).error);
});
test('follow-up requires phone only if optional phone is absent; maps best time correctly',()=>{
 const input={...quick,fldHnowy78veMuSRR:'Yes, I would like someone to contact me',fld6CeCTwH8lf4SBK:'Afternoon'};
 assert.ok(validateAnswers(input).error);
 assert.ok(validateAnswers({...input,[requiredPhone]:'5551234567'}).fields);
 const result=validateAnswers({...input,[optionalPhone]:'5551234567',[requiredPhone]:'5557654321'});
 assert.ok(result.fields); assert.equal(result.fields[requiredPhone],undefined);
});
test('hidden service, contact time, and issue details are pruned',()=>{
 const result=pruneAnswers({...detailed,fldd8eIcR9eve983F:'No',fldXM35pbwrmQZGrW:'Satisfied',fldNvAwWkbMmcHiRs:'Morning',fldYpd7M9YB3pckvU:'Hidden',fldyKV0pF6Hfrf0KF:'Visible'});
 assert.equal(result.fldXM35pbwrmQZGrW,undefined); assert.equal(result.fldNvAwWkbMmcHiRs,undefined); assert.equal(result.fldYpd7M9YB3pckvU,undefined); assert.equal(result.fldyKV0pF6Hfrf0KF,'Visible');
});
test('invalid select, type, contact and length rejected',()=>{
 for(const bad of [{[experience]:'invented'},{[name]:'   '},{fldf8bRx7eNBeYKYi:'bad-email'},{[optionalPhone]:'abcdefg'},{[name]:'x'.repeat(251)},{[name]:[]}]) assert.ok(validateAnswers({...quick,...bad}).error);
});
test('endpoint stays disabled without dedicated token and flag',async()=>{
 delete process.env.SURVEY_INTAKE_ENABLED; delete process.env.SURVEY_AIRTABLE_API_TOKEN;
 assert.equal((await (await GET()).json()).enabled,false); assert.equal((await POST(request(quick))).status,503);
});
test('server verifies origin, validates, bounds body and writes only verified destination',async()=>{
 process.env.SURVEY_INTAKE_ENABLED='true'; process.env.SURVEY_AIRTABLE_API_TOKEN='test-placeholder';
 const oldFetch=global.fetch;let calls=[];
 global.fetch=async(url,opts)=>{calls.push({url,opts});return Response.json({records:[{id:'rec12345678901234'}]});};
 try{
 assert.equal((await POST(request(quick,'http://wrong.example'))).status,403);
 assert.equal((await POST(request({...quick,[name]:''}))).status,400);
 assert.equal((await POST(request({payload:'x'.repeat(33000)}))).status,413);
 assert.equal(calls.length,0);
 assert.equal((await POST(request({...quick,arbitrary:'discard'}))).status,200);
 assert.equal(calls[0].url,'https://api.airtable.com/v0/app4ihGae0XFY7RAD/tbliyoHDTdMVNYsma');
 assert.deepEqual(JSON.parse(calls[0].opts.body),{records:[{fields:quick}],typecast:false});
 global.fetch=async()=>Response.json({error:'rejected'},{status:403});assert.equal((await POST(request(quick))).status,502);
 global.fetch=async()=>{throw Error('timeout')};const result=await POST(request(quick));assert.equal(result.status,502);assert.match((await result.json()).error,/before sending it again/);
 }finally{global.fetch=oldFetch;delete process.env.SURVEY_INTAKE_ENABLED;delete process.env.SURVEY_AIRTABLE_API_TOKEN;}
});
