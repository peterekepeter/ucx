// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { initializeState as resetExtensionState } from './extension/state';
import { vscode } from './extension/vscode';
import { langId } from './extension/constants';
import { UnrealScriptDiagnostics } from './extension/UnrealScriptDiagnostics';
import { 
    UnrealScriptDefinitionProvider, 
    UnrealScriptColorProvider, 
    UnrealScriptDocumentSymbolProvider, 
    UnrealScriptFormattingProvider, 
    UnrealScriptHoverProvider, 
    UnrealScriptSemanticTokensProvider, 
    UnrealWorkspaceSymbolProvider, 
    UnrealScriptCompletionItemProvider,
    UnrealScriptFoldingRangeProvider,
    UnrealScriptTypeHierarchyProvider
} from './extension/providers';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension "ucx" is now active!');
    resetExtensionState();

    const diagnostics = new UnrealScriptDiagnostics();
    const semanticTokensProvider = new UnrealScriptSemanticTokensProvider();

    context.subscriptions.push(
        vscode.languages.registerTypeHierarchyProvider(langId.uc, new UnrealScriptTypeHierarchyProvider()),
        vscode.languages.registerDocumentFormattingEditProvider(langId.uc, new UnrealScriptFormattingProvider()),
        vscode.languages.registerDefinitionProvider(langId.uc, new UnrealScriptDefinitionProvider()),
        vscode.languages.registerWorkspaceSymbolProvider(new UnrealWorkspaceSymbolProvider()),
        vscode.languages.registerColorProvider(langId.uc, new UnrealScriptColorProvider()),
        vscode.languages.registerDocumentSymbolProvider(langId.uc, new UnrealScriptDocumentSymbolProvider()),
        vscode.languages.registerHoverProvider(langId.uc, new UnrealScriptHoverProvider()),
        vscode.languages.registerCompletionItemProvider(langId.uc, new UnrealScriptCompletionItemProvider(), '.'),
        vscode.languages.registerDocumentSemanticTokensProvider(langId.uc, semanticTokensProvider, semanticTokensProvider.legend),
        vscode.commands.registerCommand('ucx.restartServer', () => {
            diagnostics.clearDiagnosticsCollection();
            resetExtensionState();
        }),
        vscode.languages.registerFoldingRangeProvider(langId.uc, new UnrealScriptFoldingRangeProvider()),
        diagnostics,
        vscode.workspace.onDidChangeTextDocument(event => diagnostics.updateDiagnostics(event.document))
    );

}

// this method is called when your extension is deactivated
export function deactivate() {
    console.log('Extension "ucx" has been deactivated!');
}



