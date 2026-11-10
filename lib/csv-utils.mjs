/** Order columns explicitly and neutralize spreadsheet formula injection. */
export function createCsv(rows,columns){
 if(!Array.isArray(rows)||!Array.isArray(columns)||!columns.length||columns.some(c=>typeof c!=='string'||!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(c)))throw new TypeError('Invalid columns or rows');
 const cell=value=>{
  let s=String(value??'');
  if(/^\s*[=+\-@]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
 };
 return '\uFEFF'+[columns.join(','),...rows.map(row=>columns.map(key=>cell(row?.[key])).join(','))].join('\r\n');
}

/**
 * Parse the exact CSV body intended for download and validate the header and
 * the complete row count, including quoted multi-line cells.
 */
export function inspectCsvDocument(document, expectedColumns, expectedDataRows) {
 if (typeof document !== 'string' || !document.startsWith('\uFEFF')) throw new Error('Missing UTF-8 CSV BOM');
 if (!Array.isArray(expectedColumns) || !expectedColumns.length || !Number.isInteger(expectedDataRows) || expectedDataRows < 0) throw new TypeError('Invalid CSV inspection arguments');
 const value=document.slice(1), rows=[];
 let line=[],field='',quoted=false,quoteClosed=false;
 const pushCell=()=>{line.push(field);field='';quoteClosed=false};
 const pushRow=()=>{pushCell();rows.push(line);line=[]};
 for(let i=0;i<value.length;i++){
  const c=value[i];
  if(quoted){
   if(c==='"'){if(value[i+1]==='"'){field+='"';i++}else{quoted=false;quoteClosed=true}}
   else field+=c;
  }else if(c==='"'){
   if(field.length||quoteClosed)throw new Error('Invalid quote in CSV');
   quoted=true;
  }else if(c===','){pushCell()}
  else if(c==='\r'){
   if(value[i+1]!=='\n')throw new Error('CSV must use CRLF records');
   pushRow();i++;
  }else if(c==='\n'){throw new Error('Unquoted newline in CSV')}
  else{if(quoteClosed)throw new Error('Invalid character after closing quote');field+=c}
 }
 if(quoted)throw new Error('Unclosed quoted CSV field');
 if(field.length||line.length||quoteClosed)pushRow();
 if(!rows.length)throw new Error('Empty CSV');
 if(rows[0].length!==expectedColumns.length||rows[0].some((c,i)=>c!==expectedColumns[i]))throw new Error('CSV headers do not match report');
 if(rows.length-1!==expectedDataRows)throw new Error('CSV record count mismatch');
 if(rows.some(row=>row.length!==expectedColumns.length))throw new Error('CSV column count mismatch');
 return {headers:rows[0],rowCount:rows.length-1,firstRows:rows.slice(1,5)};
}
