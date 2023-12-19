import { SemanticClass } from "./SemanticClass";

export interface ParserToken {
    readonly text: string;
    readonly line: number;
    readonly position: number;
    type: SemanticClass;
    readonly index: number;
    readonly textLower: string;
}

export function isTokenAtOrBetween(token: ParserToken, from: ParserToken, to: ParserToken){
    if (token.line < from.line) {
        return false;
    }
    if (token.line > to.line) {
        return false;
    }
    if (token.line === from.line && token.position < from.position) {
        return false;
    }
    if (token.line === to.line && token.position > to.position + to.text.length) {
        return false;
    }
    return true;
}