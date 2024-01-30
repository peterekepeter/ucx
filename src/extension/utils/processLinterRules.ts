import { lintAst } from "../../lib/lint";
import { LintResult } from "../../lib/lint/LintResult";
import { ExtensionConfiguration } from "../config";
import { vscode } from "../vscode";
import { getVsCodeDocumentAst } from "./getAst";

export function processLinterRules(document: vscode.TextDocument, config: ExtensionConfiguration): Iterable<LintResult> {
    const ast = getVsCodeDocumentAst(document);
    return lintAst(ast, config.linterConfiguration);
}
