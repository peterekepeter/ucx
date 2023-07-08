import { UcParser } from "..";
import { createEmptyStruct } from "../ast/UnrealClassStruct";
import { createEmptyUnrealClassVariable } from "../ast/UnrealClassVariable";
import { SemanticClass as C } from "../token";
import { Token } from "../types";
import { parseEnumKeyword } from "./parseEnum";
import { clearModifiers } from "./parseModifiers";
import { parseNoneState } from "./parseNoneState";


export function parseStructBegin(parser: UcParser, token: Token){
    parser.rootFn = parseStructDeclaration;
    parser.result.structs.push(createEmptyStruct(token));
    token.type = C.Keyword;
    clearModifiers(parser);
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

function parseStructBody(parser: UcParser, token: Token) {
    switch (token.textLower){
    case 'var':
        const variable = createEmptyUnrealClassVariable();
        variable.firstToken = token;
        variable.lastToken = token;
        parser.lastStruct.members.push(variable);
        token.type = C.Keyword;
        parser.lastStruct.lastToken = token;
        parser.rootFn = parseStructVar;
        break;
    case '}': 
        parser.rootFn = parseStructBodyClosed;
        parser.lastStruct.lastToken = token;
        parser.lastStruct.bodyLastToken = token;
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
    case 'enum':
        parser.typedefReturnFn = parseReturnFromEnum;
        parseEnumKeyword(parser, token);
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

function parseReturnFromEnum(parser: UcParser, token: Token) {
    parser.typedefReturnFn = null;
    const member = parser.lastStructMember;
    member.type = parser.lastEnum.name;
    parseStructVarName(parser, token);
}