import test from 'node:test';
import assert from 'node:assert/strict';
import {SITE_ORIGIN,normaliseContestantCode,contestantUrl,contestantPreview,contestantShareText} from '../lib/share-utils.mjs';
test('each contestant has a unique stable URL',()=>{
 assert.equal(normaliseContestantCode('tftc-0042'),'TFTC-0042');
 assert.equal(contestantUrl('TFTC-0042'),SITE_ORIGIN+'/contestant/TFTC-0042');
 assert.notEqual(contestantUrl('TFTC-0042'),contestantUrl('TFTC-0043'));
});
test('IDs cannot inject URL fragments, query strings or routes',()=>{
 for(const bad of ['TFTC-1','/admin','TFTC-0014?code=abc','TFTC-0014/foo','javascript:alert(1)','']){
  assert.equal(normaliseContestantCode(bad),null);
  assert.throws(()=>contestantUrl(bad));
 }
});
test('contestant-specific preview remains explicitly fictional',()=>{
 const meta=contestantPreview('Sample Singer','TFTC-0059','Worship vocalist','Lagos');
 assert.match(meta.title,/Sample Singer/);
 assert.match(meta.description,/TFTC-0059/);
 assert.match(meta.description,/fictional/);
 assert.match(meta.imageUrl,/social-card\?code=TFTC-0059$/);
 assert.match(contestantShareText('Sample Singer','TFTC-0059'),/No real payments/);
});
