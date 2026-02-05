import { UnrealClass } from '../../lib/parser';
import { ClassDatabase } from '../../lib';
import { ClassFileEntry, TokenInformation } from '../../lib/typecheck/ClassDatabase';
import { ucParseText } from '../../lib/parser/ucParse';
import { activatedAt } from '../state';
import { vscode } from '../vscode';
import { getAstFromDocument } from './getAst';
import { delay } from '../../lib/utils';
import { concurrentMap } from '../../lib/utils/concurrentMap';

export class VsCodeClassDatabase {

    private libdb = new ClassDatabase();
    private workspaceLoaded = false;
    private loadedPath: string|null = null;
    private libraryLoaded = false;

    async findSignature(vscodeuri: vscode.Uri, position: vscode.Position, cancelation: vscode.CancellationToken) {
        const uri = vscodeuri.toString();
        const result = this.libdb.findSignature(uri, position.line, position.character);
        if (result.found) return result;

        await this.requiresWorkspaceAndLibraryLoaded(cancelation);
        if (cancelation.isCancellationRequested) return { found: false };

        return this.libdb.findSignature(uri, position.line, position.character);
    }

    async findTypeDefinition(vscodeuri: vscode.Uri, position: vscode.Position, cancellation: vscode.CancellationToken) {
        const defintion = await this.findDefinition(vscodeuri, position, cancellation);
        if (cancellation.isCancellationRequested) return { found: false };
        return this.libdb.findTypeOfDefinition(defintion);
    }

    async findChildClassesOf(name: string, cancellation: vscode.CancellationToken) {
        await this.requiresWorkspaceAndLibraryLoaded(cancellation);
        if (cancellation.isCancellationRequested) return [];
        return this.libdb.findChildClassesOf(name);
    }
    
    async findParentClassOf(name: string, cancellation: vscode.CancellationToken) {
        await this.requiresWorkspaceAndLibraryLoaded(cancellation);
        if (cancellation.isCancellationRequested) return { found: false };
        return this.libdb.findParentClassOf(name);
    }

    async findDefinition(vscodeuri: vscode.Uri, position: vscode.Position, cancellation: vscode.CancellationToken) {
        const uri = vscodeuri.toString();
        const token = this.libdb.findSymbolToken(uri, position.line, position.character);

        // quickly resolve references to the given file (assumes given URI is never out of date)
        let result = this.libdb.findLocalFileDefinition(token);
        if (result.found || cancellation.isCancellationRequested) return result;

        // resolves reference from cache, updates referenced file if needed
        result = await this.getCrossFileDefinition(token, cancellation);
        if (result.found || cancellation.isCancellationRequested) return result;

        await this.requiresWorkspaceLoaded(cancellation);
        if (cancellation.isCancellationRequested) return result;

        result = await this.getCrossFileDefinition(token, cancellation);
        if (result.found || cancellation.isCancellationRequested) return result;

        await this.requiresLibraryLoaded(cancellation);
        if (cancellation.isCancellationRequested) return result;

        result = await this.getCrossFileDefinition(token, cancellation);
        if (result.found || cancellation.isCancellationRequested) return result;

        return result;
    }

    async findCompletion(vscodeuri: vscode.Uri, position: vscode.Position, cancellation: vscode.CancellationToken) {
        const uri = vscodeuri.toString();
        await this.requiresWorkspaceAndLibraryLoaded(cancellation);
        if (cancellation.isCancellationRequested) return [];
        return this.libdb.findCompletions(uri, position.line, position.character);
    }

    async getAllFileEntries(cancellation: vscode.CancellationToken, options?: { fromWorkspace: boolean, fromLibrary: boolean }): Promise<Iterable<ClassFileEntry>> {
        if (options?.fromWorkspace) {
            await this.requiresWorkspaceLoaded(cancellation);
            if (cancellation.isCancellationRequested) return [];
        }
        if (options?.fromLibrary) {
            await this.requiresLibraryLoaded(cancellation);
            if (cancellation.isCancellationRequested) return [];
        }
        return this.libdb.getAllFileEntries({ 
            includeWorkspace: options?.fromWorkspace, 
            includeLibrary: options?.fromLibrary,
        });
    }
    
    async getAllExtendableClassNames(cancellation: vscode.CancellationToken) {
        await this.requiresWorkspaceAndLibraryLoaded(cancellation);
        if (cancellation.isCancellationRequested) return [];
        return this.libdb.findAllExtendableClassNames();
    }

    private async requiresWorkspaceAndLibraryLoaded(cancellation: vscode.CancellationToken) {
        await this.requiresWorkspaceLoaded(cancellation);
        if (cancellation.isCancellationRequested) return;
        await this.requiresLibraryLoaded(cancellation);
    }

    private async requiresWorkspaceLoaded(cancellation: vscode.CancellationToken) {
        if (!this.workspaceLoaded) {
            // load workspace classses and try again
            const files = await vscode.workspace.findFiles("**/*.uc", undefined, undefined, cancellation);
            if (cancellation.isCancellationRequested) return;

            await this.updateFiles(files, cancellation, "workspace");
            if (cancellation.isCancellationRequested) return;

            // if this line is reached then workspace was fully scanned
            this.workspaceLoaded = true;
        }
    }

    private async requiresLibraryLoaded(cancellation: vscode.CancellationToken) {
        const ucxConfig = vscode.workspace.getConfiguration("ucx");
        const ignore = !ucxConfig.get<boolean>('language.searchLibrarySymbols');
        if (ignore) {
            return;
        }
        const path = ucxConfig.get<string>('libraryPath') ?? '';
        if (this.loadedPath !== path)
        {
            this.libraryLoaded = false;
            if (this.loadedPath != null){
                // loaded path has changed
                // purge previously all loaded symbols and reload workspace symbols
                this.libdb = new ClassDatabase();
                this.workspaceLoaded = false;
                this.requiresWorkspaceLoaded(cancellation);
            }
        }
        if (!this.libraryLoaded) {
            // load library classes and try again
            await this.ensureLibraryIsNotOutdated(path, cancellation);
            if (cancellation.isCancellationRequested) return;

            // if this line is reached then library was fully scanned
            this.libraryLoaded = true;
        }
    }

    private async ensureLibraryIsNotOutdated(path: string, cancellation: vscode.CancellationToken) {
        if (!path) {
            this.warnLibraryPath(path);
            return;
        }
        const searchPattern = new vscode.RelativePattern(path, '**/*.uc');

        const files = await vscode.workspace.findFiles(searchPattern, undefined, undefined, cancellation);
        if (cancellation.isCancellationRequested) return;

        if (files.length === 0)
        {
            this.warnLibraryPath(path);
        }
        await this.updateFiles(files, cancellation, "library");
    }

    private warnLibraryPath(path: string) {
        let message = "Found 0 **/*.uc files at unreal script library path.";
        if (path.startsWith('~')) 
            message = "Unreal script library path starting with ~ may not work correctly, try using full path.";
        if (!path)
            message = "Unreal script library path not configured, without it will only be able to look up symbols within current workspace.";
        vscode.window.showWarningMessage(
            message,
            "Configure", "Ignore"
        ).then(item => {
            switch (item){
            case 'Configure': 
                vscode.commands.executeCommand('workbench.action.openSettings', 'ucx.libraryPath');
                break;
            case 'Ignore':
                vscode.workspace.getConfiguration('ucx').update("language.searchLibrarySymbols", false);
                break;
            }
        });
    }

    private async updateFiles(files: vscode.Uri[], cancellation: vscode.CancellationToken, source: 'library'|'workspace') {
        let before = 0;
        let finished = 0;
        let time = Date.now();
        await concurrentMap(files, async file => { 
            const filename = file.toString();
            if (this.libdb.tagSourceAndGetVersion(filename, source) >= 0) { before+=1; return };

            const array = await vscode.workspace.fs.readFile(file);

            const str = Buffer.from(array).toString('utf8');
            const ast = ucParseText(str);
            this.libdb.updateAst(filename, ast, 0, source);

            finished+=1;
            return;
        }, 4, cancellation);
        // uncomment for stats log
        // console.log({before, finished, files: files.length, perf: Date.now()-time })
    }

    private async getCrossFileDefinition(token: TokenInformation, cancellation: vscode.CancellationToken): Promise<TokenInformation> {
        const localResult = this.libdb.findLocalFileDefinition(token);
        if (localResult.found) {
            return localResult;
        }
        const result = this.libdb.findCrossFileDefinition(token);
        if (result.found) {
            if (this.isFileOutdated(result)) {
                await this.updateFile(result);
                if (cancellation.isCancellationRequested)
                    return {};
                const updatedResult = this.libdb.findCrossFileDefinition(token);
                if (updatedResult.found) {
                    return updatedResult;
                }
            }
            else {
                return result;
            }
        }
        return result;
    }

    updateFile(cachedResult: TokenInformation) {
        // TODO;
    }

    isFileOutdated(cachedResult: TokenInformation) {
        // TODO
        return false;
    }

    updateDocumentAndGetAst(document: vscode.TextDocument, cancellation: vscode.CancellationToken): UnrealClass {
        const uri = document.uri.toString();
        if (this.libdb.getVersion(uri) >= document.version) {
            return this.libdb.getAst(uri) ?? getAstFromDocument(document, cancellation);
        }
        const ast = getAstFromDocument(document, cancellation);
        this.libdb.updateAst(uri, ast, document.version);
        console.log(uri, document.version);
        return ast;
    }

    async findReferences(document: vscode.TextDocument, position: vscode.Position, cancellation: vscode.CancellationToken) {
        const uri = document.uri.toString();
        const line = position.line;
        const character = position.character;

        this.updateDocumentAndGetAst(document, cancellation);

        const codeToken = this.libdb.findSymbolToken(uri, position.line, position.character);
        let result = this.libdb.findLocalFileDefinition(codeToken);
        if (result.paramDefinition || result.localDefinition) {
            // symbol can be resolved locally without loading extra files
            return this.libdb.findReferences(uri, line, character);
        }

        await this.requiresWorkspaceAndLibraryLoaded(cancellation);
        if (cancellation.isCancellationRequested) return [];
        
        // find references for cross file symbols
        return this.libdb.findReferences(uri, line, character);
    }

}
