import { UnrealClass } from "../..";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

const EMPTY_LINE_OR_COMMENT = /(^[ \t]*$|^\s*\/\/|.*\*\/\s*$)/;

export class EmptyLineBeforeFunction implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        const result: LintResult[] = [];
        for (const fn of ast.functions){
            const firstToken = fn.name; // not really first, might need fixing
            if (!firstToken || firstToken.line === 0){
                continue;
            }
            const lastToken = fn.bodyLastToken;
            const firstLine = firstToken.line;
            if (lastToken?.line === firstLine){
                continue;
            }
            const previousLine = firstLine - 1;
            const previousLineText = ast.textLines[previousLine] ?? '';
            
            if (!EMPTY_LINE_OR_COMMENT.test(previousLineText)){
                result.push({
                    fixedText: '\n',
                    line: previousLine,
                    length: 0,
                    position: previousLineText.length,
                    message: 'Expected empty line before function definition',
                });
            }
            
        }
        return result;
    }
}