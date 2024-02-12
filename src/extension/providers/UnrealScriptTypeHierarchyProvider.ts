import { db } from "../state";
import { rangeFromToken } from "../utils";
import { vscode } from "../vscode";



export class UnrealScriptTypeHierarchyProvider implements vscode.TypeHierarchyProvider {

    async prepareTypeHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.TypeHierarchyItem | vscode.TypeHierarchyItem[] | null> {
        db.updateDocumentAndGetAst(document, token);
        const type = await db.findDefinition(document.uri, position, token);
        if (type.classDefinition && type.uri && type.classDefinition.name) {
            return {
                uri: vscode.Uri.parse(type.uri),
                kind: vscode.SymbolKind.Class,
                name: type.classDefinition.name.text,
                range: rangeFromToken(type.classDefinition.name),
                selectionRange: rangeFromToken(type.classDefinition.name),
            };

        }
        return null;
    }

    async provideTypeHierarchySupertypes(item: vscode.TypeHierarchyItem, token: vscode.CancellationToken): Promise<vscode.TypeHierarchyItem[] | null> {
        const parent = await db.findParentClassOf(item.name, token);
        if (!parent.found || !parent.classDefinition?.name || !parent.uri) return null;
        return [{
            uri: vscode.Uri.parse(parent.uri),
            kind: vscode.SymbolKind.Class,
            name: parent.classDefinition.name.text,
            range: rangeFromToken(parent.classDefinition.name),
            selectionRange: rangeFromToken(parent.classDefinition.name),
        }];
    }

    async provideTypeHierarchySubtypes(item: vscode.TypeHierarchyItem, token: vscode.CancellationToken): Promise<vscode.TypeHierarchyItem[] | null> {
        const children = await db.findChildClassesOf(item.name, token);
        const result: vscode.TypeHierarchyItem[] = [];
        for (const c of children) {
            if (c.uri && c.classDefinition?.name) {
                result.push({
                    uri: vscode.Uri.parse(c.uri),
                    kind: vscode.SymbolKind.Class,
                    name: c.classDefinition.name.text,
                    range: rangeFromToken(c.classDefinition.name),
                    selectionRange: rangeFromToken(c.classDefinition.name),
                });
            }
        }
        if (result.length === 0) {
            return null;
        }
        return result;
    }


}