import { ParserToken } from "../types";


export interface UnrealClassEnum {
    name: ParserToken | null;
    enumeration: ParserToken[];
    firstToken: ParserToken;
    lastToken: ParserToken;
}
