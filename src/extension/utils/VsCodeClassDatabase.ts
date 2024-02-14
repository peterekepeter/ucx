import { UnrealClass } from '../../lib/parser';
import { ClassDatabase } from '../../lib';
import { TokenInformation } from '../../lib/typecheck/ClassDatabase';
import { ucParseText } from '../../lib/parser/ucParse';
import { activatedAt } from '../state';
import { vscode } from '../vscode';
import { parseConfiguration } from '../config';
import { getAstFromDocument } from './getAst';

export class VsCodeClassDatabase {

    private libdb = new ClassDatabase();
    private workspaceLoaded = false;
    private libraryLoaded = false;

    async findSignature(vscodeuri: vscode.Uri, position: vscode.Position, token: vscode.CancellationToken) {
        const uri = vscodeuri.toString();
        const result = this.libdb.findSignature(uri, position.line, position.character);
        if (result.found) return result;

        await this.requiresWorkspaceAndLibraryLoaded(token);
        if (token.isCancellationRequested) return { found: false };

        return this.libdb.findSignature(uri, position.line, position.character);
    }

    async findTypeDefinition(vscodeuri: vscode.Uri, position: vscode.Position, token: vscode.CancellationToken) {
        const defintion = await this.findDefinition(vscodeuri, position, token);
        if (token.isCancellationRequested) return { found: false };
        return this.libdb.findTypeDefinition(defintion);
    }

    async findChildClassesOf(name: string, token: vscode.CancellationToken) {
        await this.requiresWorkspaceAndLibraryLoaded(token);
        if (token.isCancellationRequested) return [];
        return this.libdb.findChildClassesOf(name);
    }
    
    async findParentClassOf(name: string, token: vscode.CancellationToken) {
        await this.requiresWorkspaceAndLibraryLoaded(token);
        if (token.isCancellationRequested) return { found: false };
        return this.libdb.findParentClassOf(name);
    }

    async findDefinition(vscodeuri: vscode.Uri, position: vscode.Position, token: vscode.CancellationToken) {
        const uri = vscodeuri.toString();
        const codeToken = this.libdb.findToken(uri, position.line, position.character);

        // quickly resolve references to the given file (assumes given URI is never out of date)
        let result = this.libdb.findLocalFileDefinition(codeToken);
        if (result.found || token.isCancellationRequested) return result;

        // resolves reference from cache, updates referenced file if needed
        result = await this.getCrossFileDefinition(codeToken);
        if (result.found || token.isCancellationRequested) return result;

        await this.requiresWorkspaceLoaded(token);
        if (token.isCancellationRequested) return result;

        result = await this.getCrossFileDefinition(codeToken);
        if (result.found || token.isCancellationRequested) return result;

        await this.requiresLibraryLoaded(token);
        if (token.isCancellationRequested) return result;

        result = await this.getCrossFileDefinition(codeToken);
        if (result.found || token.isCancellationRequested) return result;

        return result;
    }
    private async requiresWorkspaceAndLibraryLoaded(token: vscode.CancellationToken) {
        await this.requiresWorkspaceLoaded(token);
        if (token.isCancellationRequested) return;
        await this.requiresLibraryLoaded(token);
    }

    private async requiresWorkspaceLoaded(token: vscode.CancellationToken) {
        if (!this.workspaceLoaded) {
            // load workspace classses and try again
            await this.ensureWorkspaceIsNotOutdated(token);
            if (token.isCancellationRequested) return;

            // if this line is reached then workspace was fully scanned
            this.workspaceLoaded = true;
        }
    }

    private async requiresLibraryLoaded(token: vscode.CancellationToken) {
        if (!this.libraryLoaded) {
            // load library classes and try again
            await this.ensureLibraryIsNotOutdated(token);
            if (token.isCancellationRequested) return;

            // if this line is reached then library was fully scanned
            this.libraryLoaded = true;
        }
    }

    private async ensureWorkspaceIsNotOutdated(cancellation: vscode.CancellationToken) {
        const files = await vscode.workspace.findFiles("**/*.uc");
        await this.updateFiles(files, cancellation);
    }

    private async ensureLibraryIsNotOutdated(cancellation: vscode.CancellationToken) {
        const vscodeConfig = vscode.workspace.getConfiguration("ucx");
        const config = parseConfiguration(vscodeConfig);
        if (config.libraryPath) {
            const searchPattern = new vscode.RelativePattern(config.libraryPath, '**/*.uc');
            const files = await vscode.workspace.findFiles(searchPattern);
            await this.updateFiles(files, cancellation);
        }
    }

    private async updateFiles(files: vscode.Uri[], cancellation: vscode.CancellationToken) {
        for (const file of files) {
            const stats = await vscode.workspace.fs.stat(file);
            const fileVersion = this.versionFromFileStat(stats);
            const cacheKey = file.toString();
            const dbVersion = this.libdb.getVersion(cacheKey);
            if (fileVersion < dbVersion) continue;

            if (cancellation.isCancellationRequested) return;

            const array = await vscode.workspace.fs.readFile(file);
            const str = Buffer.from(array).toString('utf8');
            const ast = ucParseText(str);
            this.libdb.updateAst(file.toString(), ast, fileVersion);
        }
    }

    private versionFromFileStat(stat: vscode.FileStat): number {
        // assumes vscode closes once every 2 years or so
        const msPerHour = 1000 * 60 * 60;
        const msPerYear = msPerHour * 24 * 365.25;
        return stat.mtime - activatedAt - msPerYear * 2;
    }

    private async getCrossFileDefinition(codeToken: TokenInformation): Promise<TokenInformation> {
        const localResult = this.libdb.findLocalFileDefinition(codeToken);
        if (localResult.found) {
            return localResult;
        }
        const cachedResult = this.libdb.findCrossFileDefinition(codeToken);
        if (cachedResult.found) {
            if (this.isFileOutdated(cachedResult)) {
                await this.updateFile(cachedResult);
                const refreshedResult = this.libdb.findCrossFileDefinition(codeToken);
                if (refreshedResult.found) {
                    return refreshedResult;
                }
            }
            else {
                return cachedResult;
            }
        }
        return cachedResult;
    }

    updateFile(cachedResult: TokenInformation) {
        // TODO;
    }

    isFileOutdated(cachedResult: TokenInformation) {
        // TODO
        return false;
    }

    updateDocumentAndGetAst(document: vscode.TextDocument, token: vscode.CancellationToken): UnrealClass {
        const uri = document.uri.toString();
        if (this.libdb.getVersion(uri) >= document.version) {
            return this.libdb.getAst(uri) ?? getAstFromDocument(document, token);
        }
        const ast = getAstFromDocument(document, token);
        this.libdb.updateAst(uri, ast, document.version);
        return ast;
    }

}
