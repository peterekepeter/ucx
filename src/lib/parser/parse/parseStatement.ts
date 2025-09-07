import { SemanticClass as C, SemanticClass, UcParser } from "..";
import { UnrealClassStatement } from "../ast/UnrealClassFunction";
import { Token } from "../types";
import { parseNoneState } from "./parseNoneState";
import { resolveExpression, resolveStatementExpression } from "./resolveExpression";


function debugfmt(sts: UnrealClassStatement[], depth=0): string {
    const out = [];
    for (const st of sts) {
        out.push(`${'          '.slice(0,depth*3)}${st.op?.text} ${st.args.map(a=>'text' in a ? a.text : '[sub]').join(',')}\n`)
        if (st.body && st.body.length) {
            out.push(debugfmt(st.body, depth+1));
        }
    }
    return out.join('');
}

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
        token.type = C.Keyword;
        finalizeSingleStatementBlocksBeforeToken(parser, token)
        parser.rootFn = parseControlStatement;
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
        token.type = C.Keyword;
        finalizeSingleStatementBlocksBeforeToken(parser, token)
        parser.rootFn = parseForeachStatement;
        parser.expressionSplitter.clear();
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
        finalizeSingleStatementBlocksBeforeToken(parser, token)
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
        endStatementBlockOrFunctionBlock(parser, token);
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
        finalizeSingleStatementBlocksBeforeToken(parser, token);
        parser.expressionTokens = [];
        parser.rootFn = parseExpression;
        parser.parseToken(token);
        break;
    }
}

function parseFnLocalDeclaration(parser: UcParser, token: Token)
{
    const tokenTextLower = token.textLower;
    const fn = parser.lastFn;
    fn.locals.push({
        type: token,
        name: null,
        template: null,
    });
    parser.rootFn = tokenTextLower === 'class' ? parseFnLocalGenericBegin : parseFnLocalVar;
    token.type = C.TypeReference;
}

function parseFnLocalGenericBegin(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '<':
        token.type = C.GenericArgBegin;
        parser.rootFn = parseFnLocalGenericType;
        break;
    default:
        parseFnLocalVar(parser, token);
        break;
    }
}

function parseFnLocalGenericType(parser: UcParser, token: Token) {
    switch (token.text) {
    case '>':
        token.type = C.GenericArgEnd;
        parser.rootFn = parseFnLocalVar;
        parser.result.errors.push({
            message: "Expected generic class type.",
            token,
        });
        break;
    default:
        token.type = C.ClassReference;
        parser.rootFn = parseFnLocalGenericEnd;
        parser.lastFnLocal.template = token;
        break;
    }

}

function parseFnLocalGenericEnd(parser: UcParser, token: Token)
{
    switch (token.text) {
    case '>':
        token.type = C.GenericArgEnd;
        parser.rootFn = parseFnLocalVar;
        break;
    default:
        parser.result.errors.push({
            message: 'Expected > to close generic type.',
            token,
        });
        parseFnLocalVar(parser, token);
        break;
    }
}

function parseFnLocalVar(parser: UcParser, token: Token)
{
    switch(token.text)
    {
    case ',':
        const fn = parser.lastFn;
        fn.locals.push({
            ...parser.lastFnLocal,
            name: null
        });
        break;
    case ';':
        parser.rootFn = parseStatement;
        break;
    case '[':
        parser.rootFn = parseFnLocalVarArrayCount;
        break;
    default:
        const local = parser.lastFnLocal;
        local.name = token;
        token.type = C.LocalVariable;
        break;
    }
}

function parseFnLocalVarArrayCount(parser: UcParser, token: Token) {
    switch (token.text) {
    case ',':
    case ';':
        parser.result.errors.push({
            token: token,
            message: 'Unexpected token inside local array declaration, expeted number.',
        });
        parser.rootFn = parseFnLocalVar;
        parseFnLocalVar(parser, token);
        break;
    case ']':
        parser.rootFn = parseFnLocalVar;
        break;
    default:
        token.type = C.LiteralNumber;
        break;
    }
}

function parseExpression(parser: UcParser, token: Token)
{
    switch (token.textLower)
    {
    case "}":
        parser.lastCodeBlock.push(resolveStatementExpressionAndApplyLabel(parser));
        parser.statementEndToken = token;
        parser.rootFn = parseStatement;
        parser.parseToken(token);
        break;
    case ":":
        parser.expressionSplitter.addToken(token);
    case ";":
        const statement = resolveStatementExpressionAndApplyLabel(parser);
        statement.argsLastToken = token;
        parser.lastCodeBlock.push(statement);
        parser.statementEndToken = token;
        parser.rootFn = parseStatement;
        break;
    default:
        if (parser.expressionSplitter.canContinueWithToken(token))
        {
            parser.expressionSplitter.addToken(token);
        }
        else {
            const st = resolveStatementExpressionAndApplyLabel(parser);
            parser.lastCodeBlock.push(st);
            parser.statementEndToken = token;
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
        endStatementBlockOrFunctionBlock(parser, token);
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
        endStatementBlockOrFunctionBlock(parser, token);
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
        endStatementBlockOrFunctionBlock(parser, token);
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

function finalizeSingleStatementBlocksBeforeToken(parser: UcParser, token: Token){
    while (parser.codeBlockStack.length > 0)
    {
        const lastBlock = parser.codeBlockStack[parser.codeBlockStack.length - 1];
        if (!lastBlock.singleStatementBody){
            return; 
        }
        if (token.type === C.Keyword && token.textLower === "else")
        {
            if (lastBlock.body.length === 1)
            {
                const op = lastBlock.body[0].op;
                if (op?.type === C.Keyword && op.textLower === "if")
                {
                    return; // place matching else here
                }
            }
        }
        if (lastBlock.body.length > 1){
            if (lastBlock.body.length !== 2 || lastBlock.body[0].op?.textLower !== "if" || lastBlock.body[1].op?.textLower !== "else")
            {
                parser.result.errors.push({
                    message: 'Single statement block did not parse correctly',
                    token: parser.statementEndToken ?? lastBlock.bodyLastToken ?? lastBlock.bodyFirstToken ?? token
                });
            }
        }
        if (lastBlock.body.length >= 1){
            lastBlock.bodyLastToken = parser.statementEndToken;
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

function endStatementBlockOrFunctionBlock(parser: UcParser, endingToken: Token)
{   
    finalizeSingleStatementBlocksBeforeToken(parser, endingToken);

    if (parser.codeBlockStack.length > 0) {
        endCurrentStatementBlock(parser, endingToken);
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