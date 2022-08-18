import { ParserToken as Token } from "../";
import { createEmptyUnrealClassVariable, UnrealClassVariable } from "../ast/UnrealClassVariable";
import { SemanticClass as C } from "../token/SemanticClass";
import { UcParser } from "../UcParser";
import { clearModifiers } from "./clearModifiers";
import { parseEnumBegin } from "./parseEnum";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression } from "./resolveExpression";

export function parseVarBegin(parser: UcParser, token: Token)
{
    if (token.textLower === 'var')
    {
        const variable = createEmptyUnrealClassVariable();
        variable.firstToken = token;
        variable.lastToken = token;
        parser.rootFn = parseVarDeclaration;
        parser.result.variables.push(variable);
        token.type = C.Keyword;
        clearModifiers(parser);
    }
    else {
        parser.result.errors.push({ message: 'Not variable declaration', token });
        parser.rootFn = parseNoneState;
    }
}

function parseVarDeclaration(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.textLower){
    case 'transient': 
    case 'localized':
    case 'editconst':
    case 'const':
    case 'globalconfig':
    case 'config':
    case 'export':
    case 'native':
    case 'private':
        parser.modifiers.push(token);
        token.type = C.ModifierKeyword;
        break;
    case '(':
        parser.rootFn = parseVarGroup;
        break;
    case 'enum':
        consumeAndProcessVariableModifiers(parser, variable);
        token.type = C.Keyword;
        parseEnumBegin(parser, token);
        break;
    default:
        consumeAndProcessVariableModifiers(parser, variable);
        variable.type = token;
        token.type = C.TypeReference;
        parser.rootFn = parseVarName;
        break;
    }
}

function parseVarGroup(parser: UcParser, token: Token) {
    if (token.text === ')') {
        parser.rootFn = parseVarDeclaration;
        return;
    }
    const variable = parser.lastVar;
    variable.group = token;
    parser.rootFn = parseVarGroupNext;
}

function parseVarGroupNext(parser: UcParser, token: Token) {
    switch (token.text) {
    case ")":
        parser.rootFn = parseVarDeclaration;
        break;
    default:
        parser.result.errors.push({ token, message: 'Expected ")"' });
        // try to recover
        parseVarDeclaration(parser, token);
        break;
    }
}

function parseVarName(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text) {
    case '<':
        parser.rootFn = parseTemplateName;
        token.type = C.None;
        break;
    case ';':
        const message = 'Expected variable name isntead of ";"';
        parser.result.errors.push({ token, message });
        parser.rootFn = parseNoneState;
        variable.lastToken = token;
        break;
    default:
        token.type = C.ClassVariable;
        variable.name = token;
        parser.rootFn = parseVarNext;
        break;
    }
}

function parseTemplateName(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text) {
    case ';':
        const message = 'Expected variable name isntead of ";"';
        parser.result.errors.push({ token, message });
        parser.rootFn = parseNoneState;
        variable.lastToken = token;
        break;
    case '>':
        parser.rootFn = parseVarName;
        break;
    default:
        token.type = C.ClassReference;
        variable.template = token;
        parser.rootFn = parseAfterTemplateName;
        break;
    }
}

function parseAfterTemplateName(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text) {
    case ';':
        const message = 'Expected ">"';
        parser.result.errors.push({ token, message });
        parser.rootFn = parseNoneState;
        variable.lastToken = token;
        break;
    case '>':
        parser.rootFn = parseVarName;
        token.type = C.None;
        break;
    default:
        parser.result.errors.push({ token, message: "Expected '>'"});
        parser.rootFn = parseVarName;
        break;
    }
}


function parseVarNext(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text) {
    case '[':
        parser.rootFn = parseArrayCount;
        parser.expressionTokens = [];
        break;
    case ',':
        parser.rootFn = parseExtraVariable;
        break;
    case ';':
        variable.lastToken = token;
        parser.rootFn = parseNoneState;
        break;
    default:
        parser.result.errors.push({ token, message: 'Expecting ";" after variable name.' });
        break;
    }
}

function parseExtraVariable(parser: UcParser, token: Token) {
    switch(token.text){
    default:
        const previousVar = parser.lastVar;
        parser.result.variables.push({
            ...previousVar,
            arrayCount: null,
            lastToken: token,
            name: token,
        });
        token.type = C.ClassVariable;
        parser.rootFn = parseVarNext;
        break;
    }
}

function parseArrayCount(parser: UcParser, token:Token){
    const variable = parser.lastVar;
    switch (token.text){
    case ';':
    case ']':
        variable.arrayCountExpression = resolveExpression(parser.expressionTokens);
        if ('text' in variable.arrayCountExpression)
        {
            const token = variable.arrayCountExpression;
            variable.arrayCountToken = token;
            variable.arrayCount = parseInt(token.text);
        }
        parseAfterArrayCount(parser, token);
        break;
    
    default:
        parser.expressionTokens.push(token);
        break;
    }
}

function parseAfterArrayCount(parser: UcParser, token:Token){
    const variable = parser.lastVar;
    switch (token.text){
    case ']':
        parser.rootFn = parseVarNext;
        break;
    case ';':
        variable.lastToken = token;
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Expected ']' before ';'"});
        break;
    default:
        parser.rootFn = parseVarNext;
        parser.result.errors.push({ token, message: "Expected ']'"});
        break;
    }
}

function consumeAndProcessVariableModifiers(parser: UcParser, variable: UnrealClassVariable) {
    const modifiers = parser.modifiers;
    const v = variable;
    for (const token of modifiers){
        switch(token.textLower)
        {
        case 'transient': v.isTransient = true; break;
        case 'localized': v.localized = true; break;
        case 'editconst': v.isEditConst = true; break;
        case 'const': v.isConst = true; break;
        case 'globalconfig': v.isConfig = true; break;
        case 'config': v.isConfig = true; break;
        case 'native': v.isNative = true; break;
        case 'private': v.isPrivate = true; break;
        case 'export': v.isExport = true; break;
        default:
            parser.result.errors.push({
                message: 'Uknown variable modifier',
                token
            });
            break;
        }
    }
    clearModifiers(parser);
}


export function hasIncompleteVarDeclaration(parser: UcParser)
{
    const lastVar = parser.lastVar;
    return lastVar && !lastVar.name;
}

export function continueVarDelcarationFromTypeDeclaration(
    parser: UcParser, 
    type: Token, 
    token: Token
) {
    const lastVar = parser.lastVar;
    lastVar.type = type;
    parser.rootFn = parseVarName;
    parseVarName(parser, token);
}