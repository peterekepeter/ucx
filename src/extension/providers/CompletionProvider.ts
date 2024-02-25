import { ClassNamingRule } from "../../lib/lint/ast-rules/ClassNamingRule";
import { db } from "../state";
import { vscode } from "../vscode";


export class CompletionProvider implements vscode.CompletionItemProvider {

    async provideCompletionItems(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken, 
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionList<vscode.CompletionItem> | vscode.CompletionItem[]> {

        const ast = db.updateDocumentAndGetAst(document, token);
        // TODO move completion logic inside lib
        if (context.triggerKind === vscode.CompletionTriggerKind.Invoke) {
            if (!ast.name) {
                const expectedName = new ClassNamingRule().getExpectedClassName(document.uri.toString());
                return {
                    items: [
                        {
                            label: 'class ' + expectedName + ' extends ',
                            kind: vscode.CompletionItemKind.Class,
                            command: {
                                command: 'editor.action.triggerSuggest',
                                title: 'Complete superclass',
                            }
                        }
                    ]
                };
            }
            const lineUntilCursor = document.lineAt(position.line).text.substring(0, position.character);
            if (lineUntilCursor.match(/(?:extends|expands)\s*$/)){
                const list = await db.getAllExtendableClassNames(token);
                return list.map(item => ({
                    label: item,
                    kind: vscode.CompletionItemKind.Class,
                }) as vscode.CompletionItem);

            }
        }
        
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