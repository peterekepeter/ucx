import { parse } from "path";
import { ParserToken as Token } from "../";
import { SemanticClass as C } from "../token/SemanticClass";
import { UcParser } from "../UcParser";
import { parseNoneState } from "./parseNoneState";


export function parseVarDeclaration(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text){
    case 'transient': 
        variable.isTransient = true;
        token.type = C.Keyword;
        break;
    case 'localized':
        variable.localized = true;
        token.type = C.Keyword;
        break;
    case 'const':
        variable.isConst = true;
        token.type = C.Keyword;
        break;
    case 'config':
        variable.isConfig = true;
        token.type = C.Keyword;
        break;
    case '(':
        parser.rootFn = parseVarGroup;
        break;
    default:
        variable.type = token;
        token.type = C.TypeReference;
        parser.rootFn = parseVarName;
        break;
    }
}

function parseVarGroup(parser: UcParser, token: Token) {
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

function parseVarNext(parser: UcParser, token: Token) {
    const variable = parser.lastVar;
    switch (token.text) {
    case '[':
        parser.rootFn = parseArrayCount;
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
    default:
        variable.arrayCountToken = token;
        variable.arrayCount = parseInt(token.text);
        parser.rootFn = parseAfterArrayCount;
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
