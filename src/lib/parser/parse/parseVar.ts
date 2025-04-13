import { ParserToken, ParserToken as Token } from "../";
import { createEmptyUnrealClassVariable, createEmptyUnrealClassVariableDeclarationScope, UnrealClassVariable } from "../ast/UnrealClassVariable";
import { SemanticClass as C } from "../token/SemanticClass";
import { UcParser } from "../UcParser";
import { clearModifiers } from "./parseModifiers";
import { parseEnumKeyword } from "./parseEnum";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression } from "./resolveExpression";
import { parseStructKeyword } from "./parseStruct";

export function parseVarBegin(parser: UcParser, token: Token)
{
    if (token.textLower === 'var')
    {
        const scope = createEmptyUnrealClassVariableDeclarationScope();
        const variable = createEmptyUnrealClassVariable();
        variable.firstToken = token;
        scope.firstToken = token;
        variable.lastToken = token;
        scope.lastToken = token;

        if (parser.currentStruct) 
        {
            parser.currentStruct.members.push(variable);
        }
        else {
            parser.result.variables.push(variable);
            parser.result.variableScopes.push(scope);
        }
        parser.currentVar = variable;
        parser.currentVarScope = scope;

        parser.rootFn = parseVarDeclaration;
        token.type = C.Keyword;
        clearModifiers(parser);
    }
    else {
        exitParseVarWithError(parser, token, 'Not variable declaration');
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
    case 'travel':
    case 'input':
    case 'native':
    case 'private':
        parser.modifiers.push(token);
        token.type = C.ModifierKeyword;
        break;
    case '(':
        parser.rootFn = parseVarGroup;
        break;
    case 'struct':
        consumeAndProcessVariableModifiers(parser, variable);
        parser.typedefReturnFn = returnFromStructDeclaration;
        parseStructKeyword(parser, token);
        break;
    case 'enum':
        consumeAndProcessVariableModifiers(parser, variable);
        parser.typedefReturnFn = returnFromEnumDeclaration;
        parseEnumKeyword(parser, token);
        break;
    case 'event':
    case 'function':
    case ';':
        parseVarName(parser, token);
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
    if (parseVarCheckSuddenTerminationAndRecover(parser, token)) return;
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
        token.type = C.GenericArgBegin;
        break;
    case ';':
        exitParseVarWithError(parser, token, 'Expected variable name varname of ";"');
        break;
    default:
        if (parseVarCheckSuddenTerminationAndRecover(parser, token)) return;
        token.type = parser.currentStruct ? C.StructMemberDeclaration : C.ClassVariable;
        variable.name = token;
        parser.rootFn = parseVarNext;
        break;
    }
}

function parseTemplateName(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text) {
    case ';':
        exitParseVarWithError(parser, token, 'Expected variable name isntead of ";"');
        break;
    case '>':
        parser.rootFn = parseVarName;
        token.type = C.GenericArgEnd;
        break;
    default:
        if (parseVarCheckSuddenTerminationAndRecover(parser, token)) return;
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
        exitParseVarWithError(parser, token, 'Expected ">"');
        break;
    case '>':
        parser.rootFn = parseVarName;
        token.type = C.GenericArgEnd;
        break;
    default:
        if (parseVarCheckSuddenTerminationAndRecover(parser, token)) return;
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
        exitParseVar(parser, token);
        break;
    default:
        parseVarCheckSuddenTerminationAndRecover(parser, token, true);
        break;
    }
}

function parseVarCheckSuddenTerminationAndRecover(parser: UcParser, token: Token, isErrorForSure=false) {
    switch(token.textLower){
    case 'function':
    case 'event':
        if (isErrorForSure || parser.lastVar.firstToken?.line !== token.line) 
        {
            exitParseVarWithError(parser, token, 'Expecting ";" after variable declaration.');
            parser.rootFn(parser, token);
            return true;
        }
    }
}

function parseExtraVariable(parser: UcParser, token: Token) {
    if (parseVarCheckSuddenTerminationAndRecover(parser, token)) return;
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
    case 'function':
    case 'event':
        exitParseVarWithError(parser, token, 'Expecting ";" after variable declaration.');
        parser.rootFn(parser, token);
        break;
    case ';':
    case ']':
        variable.arrayCountExpression = resolveExpression(parser.expressionTokens);
        if ('text' in variable.arrayCountExpression)
        {
            const tok = variable.arrayCountExpression;
            variable.arrayCountToken = tok;
            variable.arrayCount = parseInt(tok.text);
        }
        parser.expressionTokens.length = 0;
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
        exitParseVarWithError(parser, token, "Expected ']' before ';'");
        break;
    default:
        exitParseVarWithError(parser, token, "Expected ']'");
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
        case 'travel': v.isTravel = true; break;
        case 'input': v.isInput = true; break;
        case 'globalconfig': v.isConfig = true; break;
        case 'config': v.isConfig = true; break;
        case 'native': v.isNative = true; break;
        case 'private': v.isPrivate = true; break;
        case 'export': v.isExport = true; break;
        default:
            parser.result.errors.push({
                message: 'Unknown variable modifier',
                token
            });
            break;
        }
    }
    clearModifiers(parser);
}

function exitParseVarWithError(parser: UcParser, token: ParserToken, message: string) {
    parser.result.errors.push({ message, token });
    exitParseVar(parser, token);
}

function exitParseVar(parser: UcParser, token: ParserToken) {
    parser.lastVar.lastToken = token;
    parser.lastVarScope.lastToken = token;
    parser.currentVar = null;
    parser.currentVarScope = null;
    parser.rootFn = parseNoneState;
}

export function hasIncompleteVarDeclaration(parser: UcParser)
{
    const lastVar = parser.lastVar;
    return lastVar && !lastVar.name;
}

function returnFromEnumDeclaration(
    parser: UcParser, 
    token: Token
) {
    parser.typedefReturnFn = null;
    parser.lastVar.type = parser.lastEnum.name;
    parser.rootFn = parseVarName;
    parseVarName(parser, token);
}

function returnFromStructDeclaration(
    parser: UcParser, 
    token: Token
) {
    parser.typedefReturnFn = null;
    parser.lastVar.type = parser.lastStruct.name;
    parser.rootFn = parseVarName;
    parseVarName(parser, token);
}

