// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import { diagnostics, resetExtensionState } from './extension/state';
import { vscode } from './extension/vscode';
import { langId } from './extension/constants';
import { 
    DefinitionProvider, 
    ColorProvider, 
    DocumentSymbolProvider, 
    FormattingProvider, 
    HoverProvider, 
    SemanticTokensProvider, 
    WorkspaceSymbolProvider, 
    CompletionProvider,
    FoldingRangeProvider,
    TypeHierarchyProvider,
    SignatureProvider,
    ReferenceProvider,
    RenameProvider,
} from './extension/providers';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
    resetExtensionState();

    const semanticTokensProvider = new SemanticTokensProvider();
    const lang = vscode.languages;
    const cmds = vscode.commands;

    context.subscriptions.push(
        lang.registerSignatureHelpProvider(langId.uc, new SignatureProvider(), '(', ','),
        lang.registerTypeHierarchyProvider(langId.uc, new TypeHierarchyProvider()),
        lang.registerDocumentFormattingEditProvider(langId.uc, new FormattingProvider()),
        lang.registerDefinitionProvider(langId.uc, new DefinitionProvider()),
        lang.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider()),
        lang.registerColorProvider(langId.uc, new ColorProvider()),
        lang.registerDocumentSymbolProvider(langId.uc, new DocumentSymbolProvider()),
        lang.registerHoverProvider(langId.uc, new HoverProvider()),
        lang.registerCompletionItemProvider(langId.uc, new CompletionProvider(), '.', "'"),
        lang.registerReferenceProvider(langId.uc, new ReferenceProvider()),
        lang.registerRenameProvider(langId.uc, new RenameProvider()),
        lang.registerDocumentSemanticTokensProvider(langId.uc, semanticTokensProvider, semanticTokensProvider.legend),
        cmds.registerCommand('ucx.restartServer', resetExtensionState),
        vscode.languages.registerFoldingRangeProvider(langId.uc, new FoldingRangeProvider()),
        diagnostics,
        vscode.workspace.onDidChangeTextDocument(event => diagnostics.updateDiagnostics(event.document)),
    );

}
