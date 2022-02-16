import { ParserToken as Token } from "..";


export interface UnrealClassEnum {
    name: Token | null;
    enumeration: Token[];
    firstToken: Token;
    firstBodyToken: Token;
    lastToken: Token;
}
