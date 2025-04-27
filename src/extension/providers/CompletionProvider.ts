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
        const results: vscode.CompletionItem[] = [];
        const items = await db.findCompletion(document.uri, position, token);
        if (token.isCancellationRequested) return results;
        for (const r of items) {
            const obj: vscode.CompletionItem = { label: r.label };
            if (r.kind) obj.kind = this.kindFromTokenType(r.kind);
            if (r.retrigger) {
                obj.command = {
                    command: 'editor.action.triggerSuggest',
                    title: 'Complete superclass',
                };
            }
            if (r.text) obj.insertText = r.text;
            results.push(obj);
        }
        return results;
    }

    kindFromTokenType(kind: SemanticClass | undefined): CompletionItemKind {
        switch(kind) {
        case SemanticClass.ClassDeclaration:
            return CompletionItemKind.Keyword;
        case SemanticClass.ClassReference:
            return CompletionItemKind.Class;
        case SemanticClass.VariableReference:
            return CompletionItemKind.Variable;
        case SemanticClass.FunctionDeclaration:
        case SemanticClass.FunctionReference:
            return CompletionItemKind.Function;
        case SemanticClass.ClassConstant:
            return CompletionItemKind.Constant;
        case SemanticClass.StructMember:
            return CompletionItemKind.Field;
        default: 
            return CompletionItemKind.Text;
        }
    }

}