import { db } from "../state";
import { vscode } from "../vscode";


export class UnrealScriptCompletionItemProvider implements vscode.CompletionItemProvider {

    async provideCompletionItems(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken, 
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionList<vscode.CompletionItem> | vscode.CompletionItem[]> {

        db.updateDocumentAndGetAst(document, token);
        if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter){
            if (context.triggerCharacter === '.') {
                const line = document.lineAt(position.line).text;
                let character = position.character;
                if (!line[character]) character -= 1;
                if (line[character] === '.') character -= 1;
                const parentSymbol = new vscode.Position(position.line, character);
                const def = await db.findTypeDefinition(document.uri, parentSymbol, token);
                if (def.ast) {
                    return {
                        isIncomplete: false,
                        items: [
                            ...def.ast.functions.map(f => ({
                                label: f.name?.text,
                                kind: vscode.CompletionItemKind.Method,
                            } as vscode.CompletionItem)),
                            ...def.ast.variables.map(v => ({
                                label: v.name?.text,
                                kind: vscode.CompletionItemKind.Variable,
                            } as vscode.CompletionItem)),
                            // {
                            //     label: 'label',
                            //     kind: vscode.CompletionItemKind.Method,
                            //     detail: 'this is a thing',
                            //     documentation: 'documentation of thing'
                            // }
                        ]
                    };
                }
            }
        }
        return [];
    }

    // resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
    //     throw new Error("Method not implemented.");
    // }


}