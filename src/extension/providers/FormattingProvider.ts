import { ExtensionConfiguration, parseConfiguration } from '../config';
import { processLinterRules } from '../utils';
import { vscode } from '../vscode';


export class FormattingProvider implements vscode.DocumentRangeFormattingEditProvider {

    provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        return this.provideDocumentRangesFormattingEdits(document, [range], options, token);
    }

    provideDocumentRangesFormattingEdits(
        document: vscode.TextDocument, ranges: vscode.Range[], options: vscode.FormattingOptions, token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        return this.provideDocumentFormattingEdits(document, options,token)
            .filter(e => ranges.find(r => r.contains(e.range)));
    }

    private provideDocumentFormattingEdits(
        document: vscode.TextDocument, options: vscode.FormattingOptions, cancellation: vscode.CancellationToken
    ): vscode.TextEdit[] {
        const vscodeConfig = vscode.workspace.getConfiguration("ucx");
        const config = parseConfiguration(vscodeConfig);
        const edits = new Array<vscode.TextEdit>();
        this.processFormattingRules(document, edits, config);
        return edits;
    }

    private processFormattingRules(document: vscode.TextDocument, edits: vscode.TextEdit[], configuration: ExtensionConfiguration) {
        for (const result of processLinterRules(document, configuration)) {
            if (result.fixedText == null || result.position == null || result.line == null || result.length == null) {
                continue;
            }
            if (result.length === 0) {
                const position = new vscode.Position(result.line, result.position);
                edits.push(vscode.TextEdit.insert(position, result.fixedText));
            } else if (result.fixedText === '') {
                let start = new vscode.Position(result.line, result.position);
                let end = new vscode.Position(result.line, result.position + result.length);
                const lineText = document.lineAt(result.line).text;
                if (end.character >= lineText.length) {
                    end = new vscode.Position(result.line + 1, 0);
                    // cannot touch whitespace befer the default prop it can interfere with indent change
                    // if (isWhitepace(lineText.substring(0, result.position))){
                    //     start = new vscode.Position(result.line, 0);
                    // }
                }
                edits.push(vscode.TextEdit.delete(new vscode.Range(start, end)));
            } else {
                const start = new vscode.Position(result.line, result.position);
                const end = new vscode.Position(result.line, result.position + result.length);
                edits.push(vscode.TextEdit.replace(new vscode.Range(start, end), result.fixedText));
            }
        }
    }

}
