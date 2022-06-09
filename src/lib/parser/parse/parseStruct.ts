import { UcParser } from "..";
import { SemanticClass as C } from "../token";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";


export function parseStructDeclaration(parser: UcParser, token: Token) {
    parser.lastStruct.name = token;
    token.type = C.StructDeclaration;
    parser.rootFn = parseStructBodyBegin;
}

function parseStructBodyBegin(parser: UcParser, token: Token) {
    if (token.text !== '{')
    {
        parser.result.errors.push({
            message: 'Expected { after struct name', token
        });
    }
    parser.rootFn = parseStructBody;
}

function parseStructBody(parser: UcParser, token: Token) {
    switch (token.textLower){
    case 'var':
        parser.lastStruct.members.push({
            name: null,
            type: null,
            isConst: false,
            isTransient: false,
            group: null,
            isConfig: false,
            firstToken: token,
            lastToken: token,
            arrayCount: null,
            arrayCountToken: null,
            localized: false,
            template: null,
            arrayCountExpression: null,
        });
        token.type = C.Keyword;
        parser.lastStruct.lastToken = token;
        parser.rootFn = parseStructVar;
        break;
    case '}': 
        parser.rootFn = parseStructBodyClosed;
        parser.lastStruct.lastToken = token;
        break;
    }
}

function parseStructBodyClosed(parser: UcParser, token: Token) {
    parser.rootFn = parseNoneState;
    if (token.text !== ';')
    {
        parser.result.errors.push({
            message: 'Expected ; after closing struct', token
        });
        parseNoneState(parser, token);
    }
}

function parseStructVar(parser: UcParser, token: Token) {
    const member = parser.lastStructMember;
    switch (token.textLower){
    case 'transient': 
        member.isTransient = true;
        token.type = C.Keyword;
        break;
    case 'localized':
        member.localized = true;
        token.type = C.Keyword;
        break;
    case 'const':
        member.isConst = true;
        token.type = C.Keyword;
        break;
    case 'globalconfig':
        member.isConfig = true;
        token.type = C.Keyword;
        break;
    case 'config':
        member.isConfig = true;
        token.type = C.Keyword;
        break;
    case '(':
        parser.rootFn = parseStructVarGroup;
        break;
    default:
        member.type = token;
        token.type = C.TypeReference;
        parser.rootFn = parseStructVarName;
        break;
    }
}

function parseStructVarGroup(parser: UcParser, token: Token) {

    switch (token.text)
    {
    case ')':
        parser.rootFn = parseStructVar;
        break;
    default:
        parser.lastStructMember.group = token;
        break;
    }
}

function parseStructVarName(parser: UcParser, token: Token) {
    const member = parser.lastStructMember;
    member.name = token;
    parser.rootFn = parseStructBody;
    token.type = C.StructMemberDeclaration;
}