import { ParserToken } from "../ParserToken";


export interface UnrealClassEnum {
    name: ParserToken | null;
    enumeration: ParserToken[];
    firstToken: ParserToken;
    lastToken: ParserToken;
}
