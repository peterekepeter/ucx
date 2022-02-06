import {AstBasedLinter} from "../AstBasedLinter";
import { LintResult } from "../LintResult";
import { UnrealClass } from "../parser";


export class AstIndentRule implements AstBasedLinter
{

    lint(ast: UnrealClass): LintResult[] | null {
        return null;
    }

}