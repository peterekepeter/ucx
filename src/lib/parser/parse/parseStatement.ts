import { SemanticClass as C, SemanticClass, UcParser } from "..";
import { UnrealClassFunctionArgument, UnrealClassStatement } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression, resolveStatementExpression } from "./resolveExpression";


export function parseStatement(parser: UcParser, token: Token)
{
    switch(token.textLower)
    {
    case "local":
        parser.rootFn = parseFnLocalDeclaration;
        token.type = C.Keyword;
        break;
    case "do":
    case "until":
    case "else":
    case "for":
    case "while":
    case "if":
    case "switch": {
        parser.rootFn = parseControlStatement;
        token.type = C.Keyword;
        const statement: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: null,
            argsLastToken: null,
            singleStatementBody: false,
        };
        parser.lastCodeBlock.push(statement);
        parser.codeBlockStack.push(statement);
        break;
    }
    case "foreach": {
        parser.rootFn = parseForeachStatement;
        parser.expressionSplitter.clear();
        token.type = C.Keyword;
        const foreach: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: null,
            bodyLastToken: null,
            argsFirstToken: null,
            argsLastToken: null,
            singleStatementBody: false,
        };
        parser.lastCodeBlock.push(foreach);
        parser.codeBlockStack.push(foreach);
        break;
    }
    case "{": {
        // codeblock
        const body = parser.lastCodeBlock;
        const codeBlock: UnrealClassStatement = {
            op: token,
            args: [],
            body: [],
            bodyFirstToken: token,
            bodyLastToken: token,
            argsFirstToken: null,
            argsLastToken: null,
            singleStatementBody: false,
        };
        body.push(codeBlock);
        parser.codeBlockStack.push(codeBlock);
        break;
    }
    case "}":
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "goto":
    case "continue":
    case "break":
    case "return":
    case "case": 
    case "default":
        token.type = SemanticClass.Keyword;
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
    token.type = C.TypeReference;
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
        token.type = C.LocalVariable;
        break;
    }
}

function parseExpression(parser: UcParser, token: Token)
{
    switch (token.textLower)
    {
    case "}":
        parser.lastCodeBlock.push(resolveStatementExpressionAndApplyLabel(parser));
        popSingleStatementCodeBlocks(parser, token);
        parser.rootFn = parseStatement;
        parser.parseToken(token);
        break;
    case ":":
        parser.expressionSplitter.addToken(token);
    case ";":
        const statement = resolveStatementExpressionAndApplyLabel(parser);
        statement.argsLastToken = token;
        parser.lastCodeBlock.push(statement);
        popSingleStatementCodeBlocks(parser, token);
        parser.rootFn = parseStatement;
        break;
    default:
        if (parser.expressionSplitter.canContinueWithToken(token))
        {
            parser.expressionSplitter.addToken(token);
        }
        else {
            const statement = resolveStatementExpressionAndApplyLabel(parser);
            parser.lastCodeBlock.push(statement);
            popSingleStatementCodeBlocks(parser, token);
            parser.rootFn = parseStatement;
            parseStatement(parser, token);
        }
        break;
    }
}

/**
 * After keyword for, while, if
 */
function parseControlStatement(parser: UcParser, token: Token)
{
    switch (token.textLower){
    case "{":
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    case "(":
        parser.expressionTokens = [];
        parser.lastStatement.argsFirstToken = token;
        parser.rootFn = parseControlCondition;
        parser.parenOpenCount = 1;
        break;
    case ";":
        endCurrentStatementBlock(parser, token);
        parser.rootFn = parseStatement;
        break;
    case "}":
        // end current control statement
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "if":
        if (parser.lastStatement.op?.textLower === 'else')
        {
            // this is an else if
            token.type = C.Keyword;
            break;
        }
    default:
        parseSingleStatementBody(parser, token);
        break;
    }
}

function parseControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case ")":
        parser.parenOpenCount--;
        if (parser.parenOpenCount !== 0){
            parser.expressionTokens.push(token);
            break;
        }
        parser.rootFn = parseAfterControlCondition;
        parser.lastStatement.argsLastToken = token;
        // intentionally let through
    case ";":
        const st = parser.lastStatement;
        if (!st){
            console.error("missing last statement????");
            break;
        }
        parser.lastStatement.args.push(resolveExpression(parser.expressionTokens));
        parser.expressionTokens = [];
        st.argsLastToken = token;
        break;
    case "}":
        parser.lastStatement.argsLastToken = token;
        // end current control statement
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "(":
        parser.parenOpenCount++;
        // intentionally let through
    default:
        parser.expressionTokens.push(token);
        break;
    }
}

function parseAfterControlCondition(parser: UcParser, token: Token)
{
    switch (token.text){
    case ";":
        endCurrentStatementBlock(parser, token);
        parser.rootFn = parseStatement;
        break;
    case "}":
        // end current control statement
        endCurrentStatementBlock(parser, token);
        // } will also close enclosing scope
        endCurrentStatementOrFunctionBlock(parser, token);
        break;
    case "{":
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
        break;
    default:
        parseSingleStatementBody(parser, token);
        break;
    }
}

function parseSingleStatementBody(parser: UcParser, token: Token)
{
    parser.rootFn = parseStatement;
    // todo check last codeblock
    parser.lastStatement.bodyFirstToken = token;
    parser.lastStatement.singleStatementBody = true;
    parseStatement(parser, token);
}

function popSingleStatementCodeBlocks(parser: UcParser, token: Token){
    while (parser.codeBlockStack.length > 0)
    {
        const lastBlock = parser.codeBlockStack[parser.codeBlockStack.length - 1];
        if (!lastBlock.singleStatementBody){
            return; 
        }
        if (lastBlock.body.length > 1){
            parser.result.errors.push({
                message: 'Single statement block did not parse correctly',
                token: lastBlock.bodyLastToken ?? lastBlock.bodyFirstToken ?? token
            });
        }
        if (lastBlock.body.length >= 1){
            lastBlock.bodyLastToken = token;
            parser.codeBlockStack.pop();
        }
        else {
            return;
        }
    }
}

function resolveStatementExpressionAndApplyLabel(parser: UcParser): UnrealClassStatement {
    let result: UnrealClassStatement;
    if (parser.expressionTokens.length > 0) {
        result = resolveStatementExpression(parser.expressionTokens);
        parser.expressionTokens = [];
    }
    else 
    { 
        result = resolveStatementExpression(parser.expressionSplitter.getTokens());
        parser.expressionSplitter.clear();
    }
    return result;
}

function endCurrentStatementOrFunctionBlock(parser: UcParser, endingToken: Token)
{   
    if (parser.codeBlockStack.length > 0) {
        endCurrentStatementBlock(parser, endingToken);
        popSingleStatementCodeBlocks(parser, endingToken);
        parser.rootFn = parseStatement;
    }
    else if (parser.currentClassState && !parser.currentlyInStateFunction){
        // was last statement in state body
        parser.rootFn = parseNoneState;
        parseNoneState(parser, endingToken); // let state parser handle this case
    }
    else{
        // ends function
        const fn = parser.lastFn;
        fn.bodyLastToken = endingToken;
        parser.rootFn = parseNoneState;
    }
}

function endCurrentStatementBlock(parser: UcParser, endingToken: Token){
    const stack = parser.codeBlockStack;
    const popped = stack.pop();
    if (!popped){
        parser.result.errors.push({
            token: endingToken, 
            message: 'Failed to close statement',
        });
        return;
    }
    popped.bodyLastToken = endingToken;
    if (!popped.bodyFirstToken) {
        popped.bodyFirstToken = endingToken;
    }
    // terminate all single statement blocks
    while (stack.length > 0 && stack[stack.length - 1].singleStatementBody)
    {
        const popped = parser.codeBlockStack.pop();
        if (popped){
            popped.bodyLastToken = endingToken;
            if (!popped.bodyFirstToken) {
                popped.bodyFirstToken = endingToken;
            }
        }
    }
}

function parseForeachStatement(parser: UcParser, token: Token)
{
    if (token.text === '{') {
        parser.lastStatement.args.push(resolveExpression(parser.expressionSplitter.getTokens()));
        parser.expressionSplitter.clear();
        parser.rootFn = parseStatement;
        parser.lastStatement.bodyFirstToken = token;
    }
    else if (parser.expressionSplitter.canContinueWithToken(token)){
        parser.expressionSplitter.addToken(token);
    }
    else {
        parser.lastStatement.args.push(resolveExpression(parser.expressionSplitter.getTokens()));
        parser.expressionSplitter.clear();
        parser.rootFn = parseSingleStatementBody;
        parser.lastStatement.bodyFirstToken = token;
        parser.rootFn(parser, token);
    }
}