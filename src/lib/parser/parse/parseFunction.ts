import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseNoneState } from "../UcParser";
import { getExpressionTokenType } from "./getExpressionTokenType";


export function parseFnDeclaration(parser: UcParser, token: Token){
    const fn = parser.lastFn;
    fn.name = token;
    token.classification = SemanticClass.FunctionDeclaration;
    parser.rootFn = parseFnParamBegin;
    // clear statement & expression state
    parser.opIdentifier = null;
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
        parser.rootFn = parseStatement;
        break;
    case ";":
        parser.rootFn = parseNoneState;
        break;
    }
}

function parseStatement(parser: UcParser, token: Token)
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
    default:
        parser.rootFn = parseExpression;
        parser.parseToken(token);
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
        parser.rootFn = parseStatement;
        break;
    default:
        const local = parser.lastFnLocal;
        local.name = token;
        token.classification = SemanticClass.LocalVariable;
        break;
    }
}

function parseExpression(parser: UcParser, token: Token)
{
    switch (token.text)
    {
    case "}":
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Function ended unexpectedly."});
        break;
    case ";":
        parser.rootFn = parseStatement;
        break;
    case "(":
        if (parser.opIdentifier){
            parser.rootFn = parseExpressionFnCall;
            const fn = parser.lastFn;
            fn.body.push({
                op: parser.opIdentifier,
                args: []
            });
            parser.opIdentifier.classification = SemanticClass.FunctionReference;
            parser.opIdentifier = null;
        }
        break;
    default:
        const type = getExpressionTokenType(token);
        token.classification = type;
        switch (type){
        case SemanticClass.Identifier:
            parser.opIdentifier = token;
            token.classification = SemanticClass.VariableReference;
            break;
        }
        break;
    }
}

function parseExpressionFnCall(parser: UcParser, token: Token){
    switch (token.text)
    {
    case "}":
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Function ended unexpectedly."});
        break;
    case ";":
        parser.rootFn = parseStatement;
        parser.result.errors.push({ token, message: "Function call ended unexpectedly."});
        break;
    case ")":
        parser.rootFn = parseExpression;
        break;
    default: 
        const fn = parser.lastFn;
        const statement = fn.body[fn.body.length - 1];
        statement.args.push(token);
        token.classification = getExpressionTokenType(token); 
        if (token.classification === SemanticClass.Identifier)
        {
            // expression should refer to variables.
            token.classification = SemanticClass.VariableReference;
        }
        parser.rootFn = parseExpressionFnCallComma;
        break;
    }
}

function parseExpressionFnCallComma(parser: UcParser, token: Token){
    switch (token.text){
    case "}":
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Function ended unexpectedly."});
        break;
    case ";":
        parser.rootFn = parseStatement;
        parser.result.errors.push({ token, message: "Function call ended too soon."});
        break;
    case ",":
        parser.rootFn = parseExpressionFnCall;
        break;
    case ")":
        parser.rootFn = parseExpression;
        break;
    default:
        const message = 'Expected "," between function call parameters.';
        parser.result.errors.push({ token, message });
    }
}