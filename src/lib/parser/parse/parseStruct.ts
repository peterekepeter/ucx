import { UcParser } from "..";
import { createEmptyStruct } from "../ast/UnrealClassStruct";
import { SemanticClass as C } from "../token";
import { Token } from "../types";
import { clearModifiers } from "./parseModifiers";
import { parseNoneState } from "./parseNoneState";
import { parseVarBegin } from "./parseVar";


export function parseStructKeyword(parser: UcParser, token: Token){
    const struct = createEmptyStruct(token);
    parser.rootFn = parseStructDeclaration;
    parser.result.structs.push(struct);
    parser.currentStruct = struct;
    token.type = C.Keyword;
    clearModifiers(parser);
    if (parser.currentVar || parser.currentVarScope) {
        parser.parentVar = parser.currentVar;
        parser.parentVarScope = parser.currentVarScope;
        parser.currentVar = null;
        parser.currentVarScope = null;
    }
}

function parseStructDeclaration(parser: UcParser, token: Token) {
    parser.lastStruct.name = token;
    token.type = C.StructDeclaration;
    parser.rootFn = parseStructBodyBegin;
}

function parseStructParentName(parser: UcParser, token: Token) {
    parser.lastStruct.parentName = token;
    parser.rootFn = parseStructBodyBegin;
}

function parseStructBodyBegin(parser: UcParser, token: Token) {
    if (token.text === 'extends')
    {
        token.type = C.Keyword;
        parser.rootFn = parseStructParentName;
        return;
    }
    if (token.text !== '{')
    {
        parser.result.errors.push({
            message: 'Expected { after struct name', token
        });
    }
    parser.lastStruct.bodyFirstToken = token;
    parser.lastStruct.bodyLastToken = token;
    parser.rootFn = parseStructBody;
}

export function parseStructBody(parser: UcParser, token: Token) {
    switch (token.textLower){
    case 'var':
        parseVarBegin(parser, token);
        break;
    case '}': 
        parser.rootFn = parseStructBodyClosed;
        parser.lastStruct.lastToken = token;
        parser.lastStruct.bodyLastToken = token;
        parser.currentStruct = null;
        break;
    }
}

function parseStructBodyClosed(parser: UcParser, token: Token) {
    if (parser.typedefReturnFn != null){
        if (parser.parentVar || parser.parentVarScope) {
            parser.currentVar = parser.parentVar;
            parser.currentVarScope = parser.parentVarScope;
            parser.parentVar = null;
            parser.parentVarScope = null;
        }
        parser.typedefReturnFn(parser, token);
        return;
    }
    parser.rootFn = parseNoneState;
    parser.currentStruct = null;
    if (token.text !== ';')
    {
        parser.result.errors.push({
            message: 'Expected ; after closing struct', token
        });
        parseNoneState(parser, token);
    }
}
