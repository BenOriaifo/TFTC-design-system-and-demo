export declare const SITE_ORIGIN:string;
export declare function normaliseContestantCode(value:unknown):string|null;
export declare function contestantUrl(code:string,origin?:string):string;
export declare function contestantShareText(name:string,code:string):string;
export declare function contestantPreview(name:string,code:string,category:string,city:string):{title:string;description:string;url:string;imageUrl:string};
