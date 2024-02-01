import { UnrealClass } from "../..";
import { ParserToken, SemanticClass as C } from "../../parser";
import { UnrealClassStatement } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";



export class ControlConditionSpacing implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] {
        let results: LintResult[] | null = [];
        let toVisit: UnrealClassStatement[][] = [];
        for (const fn of ast.functions){
            toVisit.push(fn.body);
        }
        for (let i=0; i<toVisit.length; i+=1){
            for (const statement of toVisit[i]) {
                toVisit.push(statement.body);
                const keyword = statement.op?.textLower;
                if (statement.args.length > 0 && 
                    statement.argsFirstToken?.text === '(' &&
                    statement.argsLastToken?.text === ')' &&
                    (keyword === 'for' || keyword === 'if' || keyword === 'while'))
                {

                    // check space after open before first
                    const open = statement.argsFirstToken;
                    const first = ast.tokens[open.index+1];
                    if (open.line === first.line && open.position + 1 === first.position) {
                        results.push({
                            fixedText: ' ',
                            length: 0,
                            line: first.line,
                            message: 'Required space after opening parenthesis in control structures',
                            originalText: '',
                            position: open.position + 1,
                            severity: "warning",
                            source: 'linter'
                        });
                    }

                    // check space before close after last
                    const close = statement.argsLastToken;
                    const last = ast.tokens[close.index-1];
                    if (close.line === last.line && last.position + last.text.length === close.position) {
                        results.push({
                            fixedText: ' ',
                            length: 0,
                            line: last.line,
                            message: 'Required space before closing parenthesis in control structures',
                            originalText: '',
                            position: close.position,
                            severity: "warning",
                            source: 'linter'
                        });
                    }
                    
                }
            }
        }
        return results;
    }
}
