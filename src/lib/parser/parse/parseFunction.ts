import { SemanticClass, UcParser } from "..";
import { Token } from "../types";
import { parseNoneState } from "../UcParser";
import { getExpressionTokenType } from "./classifyTokenType";
import { resolveExpression } from "./resolveExpression";


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
    case "while":
    case "if":
        parser.rootFn = parseControlStatement;
        token.classification = SemanticClass.Keyword;
        const ifStatement = {
            op: token,
            args: [],
            body: []
        };
        parser.lastFnBody.push(ifStatement);
        parser.innerStatement = ifStatement;
        break;
    case "{":
        // codeblock
        const body = parser.lastFnBody;
        const codeBlock = {
            op: token,
            args: [],
            body: [],
        };
        body.push(codeBlock);
        parser.innerStatement = codeBlock;
        break;
    case "}":
        if (parser.innerStatement){
            parser.innerStatement = null;
            break;
        }
        parser.rootFn = parseNoneState;
        break;
    default:
        // default to expression
        parser.expressionTokens = [];
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
        parser.lastFnBody.push({ ...resolveExpression(parser.expressionTokens), body: [] });
        parser.rootFn = parseStatement;
        break;
    default:
        const type = getExpressionTokenType(token);
        token.classification = type;
        parser.expressionTokens.push(token);
        break;
    }
}

function parseControlStatement(parser: UcParser, token: Token)
{
    let message = "Error";
    switch (token.text){
    case "(":
        parser.rootFn = parseControlCondition;
        break;
    default:
        message = "Expected '(' after if keyword.";
        parser.result.errors.push({ token, message });
    }
}

function parseControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case ")":
        parser.rootFn = parseAfterControlCondition;
        break;
    default:
        const st = parser.lastStatement;
        if (!st){
            console.error("missing last statement????");
            break;
        }
        parser.lastStatement.args.push(token);
        break;
    }
}

function parseAfterControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case "{":
        parser.rootFn = parseStatement;
    default:
        const message = "Expected '{'";
        parser.result.errors.push({ token, message });
        break;
    }
}