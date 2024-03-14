import { UnrealClass } from "../..";
import { ParserToken, SemanticClass as C } from "../../parser";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class OperatorSpacing implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        const results: LintResult[] = [];
        for (let i=0; i<ast.tokens.length; i++){
            const token = ast.tokens[i];
            if (token.type !== C.Operator){
                continue;
            }
            const prev = ast.tokens[i-1];
            const next = ast.tokens[i+1];
            const isPrefix = isPrefixOperator(prev, token, next);
            const isInDefaultProperties = isInDefaultPropertiesScope(token, ast);
            const isStringConcat = token.text === '$' || token.text === '@';
            const isIncrementDecrement = token.text === '++' || token.text === '--';
            const prevIsParen = prev.text === '(';
            if (prev && prev.line === token.line && !prevIsParen)
            {
                const prevEnd = prev.position + prev.text.length;
                const distance = token.position - prevEnd;
                const expectedDistance = isInDefaultProperties || isStringConcat || isIncrementDecrement ? 0 : 1;
                if (distance !== expectedDistance){
                    const message = expectedDistance === 0 
                        ? 'Expected no space before operator' 
                        : 'Expected 1 space before operator';
                    const originalLine = ast.textLines[token.line];
                    const originalText = originalLine.slice(prevEnd, token.position);
                    const fixedText = expectedDistance === 0 ? '' : ' ';
                    results.push({
                        fixedText,
                        originalText,
                        message,
                        line: token.line,
                        position: prevEnd,
                        length : originalText.length,
                        severity: "warning"
                    });
                }
            }
            if (next && next.line === token.line)
            {
                const tokenEnd = token.position + token.text.length;
                const distance = next.position - tokenEnd;
                const expectedDistance = isInDefaultProperties || isStringConcat || isPrefix || isIncrementDecrement ? 0 : 1;
                let doNotInterfere = false;
                if (next.text === ')') {
                    let count = 1;
                    // find opening
                    for (let j=i-1; j>0; j-=1)
                    {
                        if (ast.tokens[j].textLower === ')')
                            count += 1;
                        else if (ast.tokens[j].textLower === '(')
                            count -=1;
                        else if (count === 0) {
                            if (ast.tokens[j].textLower === 'for')
                                doNotInterfere = true;
                            break;
                        }
                    }
                }
                if (doNotInterfere) {
                    continue;
                }
                if (distance !== expectedDistance){
                    const originalLine = ast.textLines[token.line];
                    const originalText = originalLine.slice(tokenEnd, next.position);
                    const message = expectedDistance === 0 
                        ? 'Expected no space after operator' 
                        : 'Expected 1 space after operator';
                    const fixedText = expectedDistance === 0 ? '' : ' ';
                    results.push({
                        fixedText,
                        originalText,
                        message,
                        line: token.line,
                        position: tokenEnd,
                        length: originalText.length,
                        severity: "warning"
                    });
                }
            }

            
        }   
        return results;
    }
}

function isPrefixOperator(prev: ParserToken, token: ParserToken, next: ParserToken): boolean 
{
    if (token.type !== C.Operator ||
        !canBePrefixOperatorRegex.test(token.text))
    {
        return false;
    }
    if (!canOperatorBeAppliedTo(next)) 
    {
        return false;
    }
    if (canOperatorBeAppliedTo(prev))
    {
        return false;
    }
    return true;
}

function canOperatorBeAppliedTo(token: ParserToken)
{
    if (!token){
        return false;
    }
    switch (token.type){
    case C.ClassConstant:
    case C.ClassReference: // can be applied to static function result
    case C.ClassVariable:
    case C.FunctionReference: // can be applied to function result
    case C.Identifier:
    case C.LanguageConstant:
    case C.LiteralName:
    case C.LiteralNumber:
    case C.LiteralString:
    case C.LocalVariable:
    case C.VariableReference:
        return true;
    case C.Operator:
    default:
        return false;
    }
}

const canBePrefixOperatorRegex = /^[-!]$/;

function isInDefaultPropertiesScope(token: ParserToken, ast: UnrealClass): boolean {
    const begin = ast.defaultPropertiesFirstToken;
    const end = ast.defaultPropertiesLastToken;
    if (begin && end){
        if ((token.line > begin.line || token.line === begin.line && token.position >= begin.position) &&
            (token.line < end.line || token.line === end.line && token.position <= end.position))
        {
            return true;
        }
    }
    return false;
}
