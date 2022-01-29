import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseNoneState } from "../UcParser";


export function parseFnDeclaration(parser: UcParser, token: Token){
    const fn = parser.lastFn;
    fn.name = token;
    token.classification = SemanticClass.FunctionDeclaration;
    parser.rootFn = parseFnParamBegin;
}

function parseFnParamBegin(parser:UcParser, token:Token){
    let message = '';
    switch (token.text){
    case "(":
        parser.rootFn = parseFnParams;
        break;
    default: 
        message = "Expected function parameters '('";
        parser.result.errors.push({ token, message });
        break;
    }
}

function parseFnParams(parser: UcParser, token: Token)
{
    let message = '';
    switch (token.text){
    case ")":
        parser.rootFn = parseFnAfterParameters;
        break;
    default: 
        message = "Expected function pameter or closing parentheis ')'";
        parser.result.errors.push({ token, message });
        break;
    }
}

function parseFnAfterParameters(parser: UcParser, token: Token)
{
    switch (token.text){
    case "{":
        parser.rootFn = parseFnBody;
        break;
    case ";":
        parser.rootFn = parseNoneState;
        break;
    }
}

function parseFnBody(parser: UcParser, token: Token)
{
    switch(token.text)
    {
    case "local":
        parser.rootFn = parseFnLocalDeclaration;
        token.classification = SemanticClass.Keyword;
        break;
    case "}":
        parser.rootFn = parseNoneState;
        break;
    }
}

function parseFnLocalDeclaration(parser: UcParser, token: Token)
{
    const fn = parser.lastFn;
    fn.locals.push({
        type: token,
        name: null
    });
    parser.rootFn = parseFnLocalVar;
    token.classification = SemanticClass.TypeReference;
}

function parseFnLocalVar(parser: UcParser, token: Token)
{
    switch(token.text)
    {
    case ';':
        parser.rootFn = parseFnBody;
        break;
    default:
        const local = parser.lastFnLocal;
        local.name = token;
        token.classification = SemanticClass.LocalVariable;
        break;
    }
}