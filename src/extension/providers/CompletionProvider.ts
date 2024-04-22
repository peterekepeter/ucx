import { CompletionItemKind } from "vscode";
import { SemanticClass } from "../../lib/parser";
import { db } from "../state";
import { vscode } from "../vscode";


export class CompletionProvider implements vscode.CompletionItemProvider {

    async provideCompletionItems(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken, 
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionList<vscode.CompletionItem> | vscode.CompletionItem[]> {

        db.updateDocumentAndGetAst(document, token);

        const result = await db.findCompletion(document.uri, position, token); 
        return result.map(r =>( {
            label: r.label,
            kind: this.kindFromTokenType(r.kind),
            command: r.retrigger ? {
                command: 'editor.action.triggerSuggest',
                title: 'Complete superclass',
            } : undefined,
        }));
    }

    kindFromTokenType(kind: SemanticClass | undefined): CompletionItemKind {
        switch(kind) {
        case SemanticClass.ClassDeclaration:
            return CompletionItemKind.Keyword;
        case SemanticClass.ClassReference:
            return CompletionItemKind.Class;
        case SemanticClass.VariableReference:
            return CompletionItemKind.Variable;
        case SemanticClass.FunctionReference:
            return CompletionItemKind.Function;
        default: 
            return CompletionItemKind.Text;
        }
    }

}