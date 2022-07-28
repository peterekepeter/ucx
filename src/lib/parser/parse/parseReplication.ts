import { SemanticClass } from "../token";
import { Token } from "../types";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";


export function parseReplication(parser: UcParser, token: Token) {
    switch (token.textLower){
    case 'unreliable': 
        token.type = SemanticClass.Keyword;
        break;
    case 'reliable': 
        token.type = SemanticClass.Keyword;
        break;
    case 'if': 
        token.type = SemanticClass.Keyword;
        break;
    case '}': 
        parser.rootFn = parseNoneState;
        break;
    }
}