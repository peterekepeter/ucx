import { UnrealClass } from "../parser";
import { ParserError } from "../parser/types";
import { buildFullLinter, FullLinterConfig } from "./buildFullLinter";
import { LintResult } from "./LintResult";

export function* lintAst(ast: UnrealClass, config?: Partial<FullLinterConfig>): Iterable<LintResult> {
    for (const parseError of ast.errors){
        yield mapAstErrorToLintResult(parseError);
    }
    const linter = buildFullLinter(config);
    const results = linter.lint(ast);
    for (const item of results){
        yield item;
    }
}

function mapAstErrorToLintResult(parseError: ParserError): LintResult {
    return {
        message: parseError.message,
        line: parseError.token.line,
        position: parseError.token.position,
        length: parseError.token.text.length,
        originalText: parseError.token.text,
        severity: 'error',
        source: 'parser'
    };
}
