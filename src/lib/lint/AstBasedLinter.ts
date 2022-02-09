import { LintResult } from "./LintResult";
import { UnrealClass } from "../";

export interface AstBasedLinter
{
    /**
     * Check AST for issues
     */
    lint(ast: UnrealClass): LintResult[] | null;
}