import { UcxCommand } from "../cli";
import { detectPathSeparator } from "./filesystem";
import { promises as fs } from "fs";
import { lintAst } from "../lint";
import { getAstFromFile } from "./getAstFromFile";
import { UserInputError } from "./error";
import { LintResult } from "../lint/LintResult";
import { ParserToken, SemanticClass as C, UnrealClass } from "../parser";
import { blue, bold, cyan, gray, green, magenta, red, yellow } from "./terminal";

type LintContext = {
    successful: boolean;
    fileSeparator: string
    errorCount: number,
    warningCount: number,
    filesParsed: number,
    ignoreWarnings: boolean,
    ignoreErrors: boolean,
    perfParse: number,
    perfLint: number,
};

export async function execLint(cmd: UcxCommand): Promise<void> {
    if (cmd.files.length === 0) {
        throw new UserInputError("No files were given to lint");
    }
    const context: LintContext = {
        fileSeparator: detectPathSeparator(cmd.ucxScript),
        ignoreWarnings: cmd.quiet || cmd.benchmark,
        ignoreErrors: cmd.benchmark,
        errorCount: 0,
        filesParsed: 0,
        warningCount: 0,
        successful: true,
        perfParse: 0,
        perfLint: 0,
    };
    const runs = cmd.runcount;
    let timeStart = 0;
    if (cmd.benchmark)
    {
        console.log('Note: output may be modified because benchmarking is enabled')
        timeStart = performance.now();
    }
    for (let i=0; i<runs; i+=1) 
    {
        context.filesParsed = 0;
        context.errorCount = 0;
        context. warningCount = 0;
        for (const file of cmd.files)
        {
            await lintVisitPath(file, context);
        }
    }
    if (cmd.benchmark)
    {
        const timeTaken = (performance.now() - timeStart)/runs;
        const timeParse = context.perfParse / runs;
        const timeLint = context.perfLint / runs;
        console.log([
            `Benchmark total ${timeTaken}ms:`,
            `\tparse:\t${timeParse}ms`,
            `\tlint:\t${timeLint}ms`,
            `\tother:\t${timeTaken-timeParse-timeLint}ms`,
        ].join('\n'))
    }
    evalLintResult(context);
    console.log(getStatusMessage(context));
    process.exit(context.successful ? 0 : 1);
}

async function lintVisitPath(file: string, context: LintContext) {
    const stat = await fs.stat(file);
    if (stat.isDirectory()){
        await lintVisitDirectory(file, context);
    }
    else if (stat.isFile())
    {
        await lintVisitFile(file, context);
    }
}

async function lintVisitDirectory(path: string, context: LintContext) {
    for (const child of await fs.readdir(path)){
        const childPath = path + context.fileSeparator + child;
        await lintVisitPath(childPath, context);
    }
}

async function lintVisitFile(file: string, context: LintContext) {
    if (!file.endsWith('.uc')) {
        return; 
    }
    const ignoreWarnings = context.ignoreWarnings;
    let ast: UnrealClass;
    const timeStart = performance.now();
    try 
    {
        context.filesParsed += 1;
        ast = await getAstFromFile(file);
    }
    catch (error){
        console.log(`${file} ${red(bold("parser failed !!!"))}`);
        context.errorCount += 1;
        return;
    }
    const timeAfterParse = performance.now();
    try 
    {
        let localErrorCount = 0;
        let localWarningCount = 0;
        let reachedErrorLimit = false;
        let reachedWarningLimit = false;
        let maxPrint = 16;
        for (const problem of lintAst(ast)) {
            if (problem.severity === 'error') {
                context.errorCount += 1;
                localErrorCount += 1;
                if (!context.ignoreErrors)
                {
                    if (localErrorCount < maxPrint) {
                        printProblem(ast, problem);
                    } else if (!reachedErrorLimit) {
                        reachedErrorLimit = true;
                        console.log(`${file} ${red(bold("reached error limit"))}`);
                    }
                }
            } else {
                context.warningCount += 1;
                localWarningCount += 1;
                if (!ignoreWarnings)
                {
                    if (localWarningCount < maxPrint) {
                        printProblem(ast, problem);
                    } else if (!reachedWarningLimit) {
                        reachedWarningLimit = true;
                        console.log(`${file} ${yellow(bold("reached warning limit"))}`);
                    }
                }
            }
        }
    }
    catch (error){
        console.log(`${file} ${red(bold("linter failed !!!"))}`);
        context.errorCount += 1;
        return;
    }
    const timeAfterLint = performance.now();
    context.perfParse += timeAfterParse - timeStart;
    context.perfLint += timeAfterLint - timeAfterParse;
}

function printProblem(ast: UnrealClass, problem: LintResult) {
    const lineNo = (problem.line ?? 0) + 1;
    const positionNo = (problem.position ?? 0) + 1;
    const isError = problem.severity === 'error';
    const type = isError ? 'error' : 'warn';
    const paddedType = type.padStart(8, ' ');
    const msg = bold(problem.message ?? '');
    const tag = bold(isError ? red(paddedType) : yellow(paddedType));
    let preview = '';
    if (problem.line != null) {
        const srcLines = [];
        const srcIndexes = [];
        let printFrom = -1;
        let printTo = -1;
        for (let i=problem.line-2; i<problem.line+2; i+=1){
            const content = ast.textLines[i] ?? '';
            const index = srcLines.length;
            srcLines.push(ast.textLines[i] ?? '');
            srcIndexes.push(i);
            const ws = isWhitepace(content);
            if (printFrom === -1 && !ws) {
                printFrom = index;
            }
            if (!ws) {
                printTo = index;
            }
        }
        if (printFrom !== -1 && printTo !== -1){
            for (let i=printFrom; i<=printTo; i+=1){
                const srcLineNo = srcIndexes[i];
                const srcLineContent = srcLines[i];
                const lineColumn = gray(srcLineNo.toString().padStart(8, ' ') + ' | ');
                const content = getFormattedContent(srcLineContent, srcLineNo, ast).replace('\t', ' ');
                preview += `${lineColumn}${content}\n`;
                if (srcIndexes[i] === problem.line && problem.position != null && problem.length != null) {
                    const spaceBefore = ''.padStart(11 + problem.position,' ');
                    const chars = bold(''.padStart(Math.max(1, problem.length), '~'));
                    const cchars = isError ? red(chars) : yellow(chars);
                    preview += `${spaceBefore}${cchars}\n`;
                }
            }
        }
    }
    console.log(`${ast.fileName}:${lineNo}:${positionNo}\n${preview}${tag} : ${msg}\n`);
}

function isWhitepace(input: string){
    return /^\s*$/.test(input);
}

function getFormattedContent(str: string, srcLineNo: number, ast: UnrealClass): string {
    const formatLineIndex = srcLineNo - 0;
    for (let i=ast.tokens.length-1; i>=0; i-=1) {
        const token = ast.tokens[i];
        if (token.line !== formatLineIndex) {
            continue;
        }
        const from = token.position;
        const to = from + token.text.length;
        str = str.substring(0, from) 
            + foramtToken(str.substring(from, to), token)
            + str.substring(to);
    }
    return str;
}

function foramtToken(str: string, token: ParserToken): string {
    switch (token.type){
    case C.None:
        break;
    case C.Keyword:
    case C.ModifierKeyword:
        str = magenta(str);
        break;
    case C.Comment:
        str = gray(str);
        break;
    case C.ClassDeclaration:
    case C.EnumDeclaration:
        str = cyan(str);
        break;
    case C.ClassReference:
    case C.ClassVariable:
    case C.LocalVariable:
    case C.EnumMember:
    case C.ClassConstant:
        str = green(str);
        break;
    case C.TypeReference:
        str = magenta(str);
        break;
    case C.LanguageConstant:
    case C.LiteralString:
    case C.LiteralName:
    case C.LiteralNumber:
        str = blue(str);
        break;
    case C.Identifier:
    case C.FunctionDeclaration:
    case C.FunctionReference:
        str = blue(str);
        break;
    case C.AssignmentOperator:
    case C.Operator:
        str = gray(str);
        break;
    case C.VariableReference:
    case C.ExecInstruction:
        str = gray(str);
        break;
    case C.ObjectReferenceName:
    case C.StateDeclaration:
    case C.StateReference:
    case C.StatementLabel:
    case C.StructDeclaration:
    case C.StructMember:
    case C.StructMemberDeclaration:
        str = yellow(str);
        break;
    }
    return str;
}

function getStatusMessage(context: LintContext): string {
    const err = context.errorCount;
    const files = context.filesParsed;
    const warn = context.warningCount;
    const passed = context.successful;

    const list = [
        passed ? 'passed' : 'failed',
        'with',
    ];

    if (files <= 0) {
        return bold(red("no input files were found..."));
    }

    if (err > 0){
        list.push(bold(red(`${err} error${err===1?'':'s'}`)));
    }
    else {
        list.push('no errors');
    }

    list.push('and');

    if (warn > 0){
        list.push(bold(yellow(`${warn} warning${warn===1?'':'s'}`)));
    }
    else {
        list.push('no warnings');
    }

    list.push("in");
    list.push(bold(`${files} file${files===1?'':'s'}`));

    return list.join(' ');
}

function evalLintResult(context: LintContext) {
    context.successful = context.errorCount <= 0 && context.filesParsed > 0;
}

