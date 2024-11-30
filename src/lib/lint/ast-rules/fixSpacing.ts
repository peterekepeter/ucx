import { ParserToken, UnrealClass } from "../../parser";
import { LintResult } from "../LintResult";


/** Check if desired space is around token and adds it if it is missing */
export function fixSpaceAroundToken(
    result: LintResult[] | null,
    ast: UnrealClass,
    tokenIndex: number,
    spaceBefore: string,
    msgBefore: string,
    spaceAfter: string,
    msgAfter: string,
):
    LintResult[] | null
{
    var before = ast.tokens[tokenIndex-1];
    var current = ast.tokens[tokenIndex];
    var after = ast.tokens[tokenIndex + 1];
    if (!before || !current || !after) {
        return result;
    }
    var space = '';
    result = fixSpaceBetweenTokens(result, ast, before, current, spaceBefore, msgBefore);
    result = fixSpaceBetweenTokens(result, ast, current, after, spaceAfter, msgAfter);
    return result;
}

export function fixSpaceBetweenTokens(
    result: LintResult[] | null,
    ast: UnrealClass,
    a: ParserToken,
    b: ParserToken,
    fixedText: string,
    message: string,
):
    LintResult[] | null
{
    if (a.line !== b.line) {
        return result; // not supported
    }
    var endOfA = a.position + a.text.length;
    var beginOfB = b.position;
    var distance = beginOfB - endOfA;
    var originalLine = ast.textLines[a.line];
    var originalText = originalLine.slice(endOfA, beginOfB);
    if (distance !== fixedText.length) {
        if (!result) result = [];
        result.push({
            severity: 'warning',
            line: a.line,
            message,
            position: endOfA,
            length: distance,
            fixedText,
            originalText,
            source: 'linter',
        });
    }
    return result;
}