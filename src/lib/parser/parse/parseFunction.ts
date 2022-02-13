import { SemanticClass, UcParser } from "..";
import { UnrealClassStatement } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { parseNoneState } from "../UcParser";
import { getExpressionTokenType } from "./classifyTokenType";
import { resolveExpression, resolveStatementExpression } from "./resolveExpression";


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
    const fn = parser.lastFn;
    switch (token.text){
    case "{":
        fn.bodyFirstToken = token;
        fn.bodyLastToken = token;
        parser.rootFn = parseStatement;
        break;
    case ";":
        // missing body, don't set body tokens
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
    case "else":
    case "for":
    case "while":
    case "if":
        parser.rootFn = parseControlStatement;
        token.classification = SemanticClass.Keyword;
        const statement: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null
        };
        parser.lastCodeBlock.push(statement);
        parser.codeBlockStack.push(statement);
        break;
    case "{":
        // codeblock
        const body = parser.lastCodeBlock;
        const codeBlock: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: token,
            bodyLastToken: token
        };
        body.push(codeBlock);
        parser.codeBlockStack.push(codeBlock);
        break;
    case "}":
        if (parser.codeBlockStack.length > 0){
            const popped = parser.codeBlockStack.pop();
            if (popped) {
                popped.bodyLastToken = token;
            }
            break;
        }
        const fn = parser.lastFn;
        fn.bodyLastToken = token;
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
        const fn = parser.lastFn;
        parser.lastCodeBlock.push(resolveStatementExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        fn.bodyLastToken = token;
        parser.rootFn = parseNoneState;
        parser.result.errors.push({ token, message: "Function ended unexpectedly."});
        break;
    case ";":
        parser.lastCodeBlock.push(resolveStatementExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        parser.rootFn = parseStatement;
        break;
    default:
        const type = getExpressionTokenType(token);
        token.classification = type;
        parser.expressionTokens.push(token);
        break;
    }
}

/**
 * Can be for, while, if
 */
function parseControlStatement(parser: UcParser, token: Token)
{
    let message = "Error";
    switch (token.text){
    case "{":
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    case "(":
        parser.expressionTokens = [];
        parser.rootFn = parseControlCondition;
        break;
    default:
        message = "Expected '(' or '{' after keyword.";
        parser.result.errors.push({ token, message });
    }
}

function parseControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case ")":
        parser.rootFn = parseAfterControlCondition;
    case ";":
        const st = parser.lastStatement;
        if (!st){
            console.error("missing last statement????");
            break;
        }
        parser.lastStatement.args.push(resolveExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        break;
    default:
        const type = getExpressionTokenType(token);
        token.classification = type;
        parser.expressionTokens.push(token);
        break;
    }
}

function parseAfterControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case "{":
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    default:
        const message = "Expected '{'";
        parser.result.errors.push({ token, message });
        break;
    }
}