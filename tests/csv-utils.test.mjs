import test from 'node:test';
import assert from 'node:assert/strict';
import {createCsv,inspectCsvDocument} from '../lib/csv-utils.mjs';
test('CSV writes BOM, stable column order and Unicode',()=>{
 const s=createCsv([{name:'Ada ₦',amount:2000,reference:'TFTC-0042'}],['reference','name','amount']);
 assert.ok(s.startsWith('\uFEFFreference,name,amount\r\n'));
 assert.ok(s.includes('"TFTC-0042","Ada ₦","2000"'));
});
test('CSV quotes commas, line breaks and double quotes',()=>{
 const s=createCsv([{name:'Jo "Choir", Jr\nNew line'}],['name']);
 assert.ok(s.includes('"Jo ""Choir"", Jr\nNew line"'));
});
test('CSV neutralizes formula-like cells',()=>{
 const s=createCsv([{name:'=SUM(1,1)'},{name:' +SUM(1,1)'},{name:'-1+2'},{name:'@command'}],['name']);
 for(const fragment of ["'=SUM","' +SUM","'-1+2","'@command"])assert.ok(s.includes(fragment));
});
test('CSV keeps empty and zero values correctly',()=>{
 const s=createCsv([{name:null,amount:0},{name:'B',amount:5}],['name','amount']);
 assert.equal(s.split('\r\n').length,3);
 assert.ok(s.includes('"","0"'));
});
test('CSV refuses unexpected columns',()=>{
 assert.throws(()=>createCsv([{x:1}],['x,unsafe']));
});

test('generated file inspection checks real records and UTF-8 CSV structure',()=>{
 const columns=['reference','code','name','status','amount','created_at'];
 const rows=[{reference:'qa1',code:'TFTC-0042',name:'Choir, Alex',status:'simulated_success',amount:2000,created_at:'2026-11-04T12:00:00Z'}];
 const doc=createCsv(rows,columns);
 const report=inspectCsvDocument(doc,columns,1);
 assert.equal(report.rowCount,1);
 assert.equal(report.firstRows[0][2],'Choir, Alex');
 assert.equal(report.firstRows[0][4],'2000');
});
test('multi-line quoted field is one record, not two',()=>{
 const columns=['name','note'];
 const csv=createCsv([{name:'Singer',note:'Line 1\nLine 2'}],columns);
 const parsed=inspectCsvDocument(csv,columns,1);
 assert.equal(parsed.rowCount,1);
 assert.equal(parsed.firstRows[0][1],'Line 1\nLine 2');
});
test('all four staff export structures validate on fictional fixtures',()=>{
 const examples=[
  [{votes:25,price:1000,successful:1,failed:0,total_votes_credited:25,mock_gross:1000},['votes','price','successful','failed','total_votes_credited','mock_gross']],
  [{reference:'qa1',code:'TFTC-0042',name:'Sample',status:'simulated_success',amount:2000,created_at:'2026-11-04'},['reference','code','name','status','amount','created_at']],
  [{reference:'qa1',code:'TFTC-0042',name:'Sample',version:'v3',accepted_at:'2026-11-04',source:'simulated_checkbox'},['reference','code','name','version','accepted_at','source']],
  [{rank:1,code:'TFTC-0042',name:'Sample',votes:25,last_vote_at:'2026-11-04'},['rank','code','name','votes','last_vote_at']]
 ];
 for(const [record,columns] of examples)assert.equal(inspectCsvDocument(createCsv([record],columns),columns,1).rowCount,1);
});
test('export validation rejects tampered row counts, headers and quotes',()=>{
 const d=createCsv([{name:'Sample'}],['name']);
 assert.throws(()=>inspectCsvDocument(d,['amount'],1));
 assert.throws(()=>inspectCsvDocument(d,['name'],2));
 assert.throws(()=>inspectCsvDocument('\uFEFFname\r\n"unclosed', ['name'],1));
});
