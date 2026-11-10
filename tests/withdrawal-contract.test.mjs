import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
const ui=read('../components/WithdrawAccount.tsx');
const dashboard=read('../components/DemoAccounts.tsx');
const edge=read('../supabase/functions/tftc-demo-withdraw/index.ts');
const data=read('../lib/data.ts');

test('double confirmation before voluntary withdrawal',()=>{
 assert.match(ui,/phrase!=='WITHDRAW'/);
 assert.match(ui,/acknowledged/);
 assert.match(ui,/window\.confirm\(/);
 assert.match(edge,/input\.confirmation!=="WITHDRAW"/);
});
test('verified email and unclaimed legacy accounts use distinct authentication',()=>{
 assert.match(edge,/auth\/v1\/user/);
 assert.match(edge,/p_owner_user_id:owner/);
 assert.match(edge,/p_access_token:owner\?null:input\.access_token/);
});
test('withdrawal operates through service-only database RPC',()=>{
 assert.match(edge,/rest\/v1\/rpc\/tftc_demo_self_withdraw/);
 assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(edge,/p_confirmation:"WITHDRAW"/);
});
test('public directory and contestant dashboard hide withdrawn profiles',()=>{
 assert.match(data,/status=eq\.approved/);
 assert.match(dashboard,/account\.status!=='approved'/);
 assert.match(dashboard,/WithdrawAccount/);
});
