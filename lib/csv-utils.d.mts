export declare function createCsv(rows:ReadonlyArray<Record<string,unknown>>,columns:string[]):string;
export declare function inspectCsvDocument(document:string,expectedColumns:string[],expectedDataRows:number):{headers:string[];rowCount:number;firstRows:string[][]};
