import { ExtensionConfiguration, getEditorOptions, parseConfiguration } from "./config";
import { langId } from "./constants";
import { processLinterRules } from "./utils";
import { vscode } from "./vscode";

export class UnrealScriptDiagnostics implements vscode.Disposable {

    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor () {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ucx');
    }

    dispose() {
        this.diagnosticCollection.dispose();
    }

    clearDiagnosticsCollection() {
        this.diagnosticCollection.clear();
    }

    updateDiagnostics(document: vscode.TextDocument) {
    
        if (document.languageId === langId.uc){
            const vscodeConfig = vscode.workspace.getConfiguration("ucx");
            const config = parseConfiguration(vscodeConfig);
            const diagnositcs = [...this.getDiagnostics(document, config)];
            this.diagnosticCollection.set(document.uri, diagnositcs);
    
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document && config.overrideEditorIndentationStyle) {
                editor.options = getEditorOptions(config);
            }
        }
    }

    *getDiagnostics(document: vscode.TextDocument, config: ExtensionConfiguration): Iterable<vscode.Diagnostic> {
        for (const lintResult of processLinterRules(document, config)){
            if (!config.showErrors && lintResult.severity === 'error') {
                continue;
            }
            if (!config.showWarnings && lintResult.severity !== 'error') {
                continue;
            }
            if (lintResult.message != null && 
                lintResult.line != null &&
                lintResult.position != null &&
                lintResult.length != null)
            {
                const begin  = new vscode.Position(lintResult.line, lintResult.position);
                const end = new vscode.Position(lintResult.line, lintResult.position + lintResult.length);
                yield {
                    message: lintResult.message,
                    range: new vscode.Range(begin, end),
                    severity: lintResult.severity === 'error' 
                        ? vscode.DiagnosticSeverity.Error
                        : vscode.DiagnosticSeverity.Warning,
                    source: 'ucx'
                };
            }
        }
    }

}
