import { UcxCommand } from "../cli";
import { promises as fs, constants } from "fs";
import { SourceEditor, transformFor436 } from "../transformer";
import { UcParser, UnrealClass } from "../parser";
import { ucTokenizeLine } from "../tokenizer";
import { InvalidUccPath } from "./InvalidUccPath";

import path = require("path");
import { green, bold, gray, yellow } from "./terminal";
import { detectPathSeparator, getFilename, pathUpOneLevel } from "./filesystem";
import { Subprocess } from "./subprocess/Subprocess";

export async function execBuild(cmd: UcxCommand){
    const projectFolders = await getBuildProjects(cmd.files);
    let context: BuildContext | undefined;
    for (const project of projectFolders){
        try {
            context = await getBuildContext(project, cmd);
            await buildProject(context);
        }
        finally {
            if (context && context.performCleanup) {
                await deleteTemporaryFiles(context);
            }
            context = undefined;
        }
    }
}

async function buildProject(context: BuildContext) {
    await visitSourceFolder(context, context.projectDir);
    await generateBuildIniIfNotExists(context);
    await runUccBuildCommand(context);
    await copyOutput(context);
}

async function getBuildContext(projectDir: string, cmd: UcxCommand): Promise<BuildContext> {
    const resolvedPaths = await getUccPath(cmd.uccPath);
    const projectName = await getProjectNameFromPath(projectDir);
    const context: BuildContext = {
        tempToCleanup: [],
        projectName,
        projectDir,
        performCleanup: !cmd.noClean,
        pathSeparator: detectPathSeparator(projectDir),
        ... resolvedPaths,
        ... await generateBuildNameAndDir(resolvedPaths.gameDir),
    };
    context.tempToCleanup.push({ fullPath: context.buildDir, isDir: true });
    context.tempToCleanup.push({ fullPath: context.buildClassesDir, isDir: true });
    console.log(green('building'), bold(projectName), gray(context.buildName));
    return context;
}

function getProjectNameFromPath(projectDir: string){
    const separator = detectPathSeparator(projectDir);
    const pos = projectDir.lastIndexOf(separator);
    let name = '';
    
    if (pos > 0){
        name = projectDir.substring(pos + 1);
    }
    
    if (!name){
        throw new Error(`unabled to determine project package name from "${projectDir}"`);
    }
    return name;
}

async function getUccPath(inputUccPath: string)
: Promise<{ uccPath: string, systemDir: string, gameDir: string }> {
    try {
        const separator = detectPathSeparator(inputUccPath);
        const uccPath = inputUccPath;
        const systemDir = pathUpOneLevel(uccPath, separator);
        const gameDir = pathUpOneLevel(systemDir, separator);
        const result = {
            uccPath,
            gameDir,
            systemDir,
        };
        return result;
    }
    catch (error){
        throw new InvalidUccPath(`UCC path is required, "${inputUccPath}" not valid path`, error);
    }
}

async function getBuildProjects(files: string[]): Promise<string[]> {
    if (files.length === 0){
        throw new Error("Build command needs at least 1 project folder where scripts are located.");
    }
    const result: string[] = [];
    for (const file of files){
        result.push(await fs.realpath(file));
    }
    return result;
}

interface BuildContext
{
    uccPath: string;
    projectDir: string;
    projectName: string;
    pathSeparator: string;
    systemDir: string;
    gameDir: string
    buildDir: string;
    buildClassesDir: string;
    buildName: string;
    buildIniFile?: string
    performCleanup: boolean,
    tempToCleanup: { fullPath: string, isDir: boolean }[];
}


async function visitSourceFolder(context: BuildContext, dirPath: string) {
    const outName = getBuildPath(context, dirPath);
    await tempMkDir(context, outName);

    for (const item of await fs.readdir(dirPath)){
        const fullPath = `${dirPath}${context.pathSeparator}${item}`;
        const stat = await fs.stat(fullPath);
        if (item.startsWith('.')){
            continue; // ignore
        }
        if (stat.isDirectory()){
            await visitSourceFolder(context, fullPath);
        }
        else if (stat.isFile()){
            await visitSourceFile(context, fullPath);
        }
    }
}

async function visitSourceFile(context: BuildContext, srcPath: string) {
    if (srcPath.endsWith('.ini')){
        const destPath = getBuildPath(context, srcPath);
        context.buildIniFile = destPath;
        let content = await fs.readFile(srcPath, 'utf-8');
        if (content.indexOf('EditPackages=') !== -1)
        {
            // assume it's the ini config to be used for building
            // patch it temporary package name
            const toReplace = `EditPackages=${context.projectName}`;
            const replaceWith = `EditPackages=${context.buildName}`;
            content = content.replace(toReplace, replaceWith);
            await tempWrite(context, destPath, content);
            return;
        }
        else {
            await tempCopy(context, srcPath, destPath);
        }
    } 
    else if (srcPath.endsWith('.uc')){
        const destPath = getBuildClassesPath(context, srcPath);
        await tempTransformSource(context, srcPath, destPath);
        return;
    }
    else {
        const destPath = getBuildPath(context, srcPath);
        await tempCopy(context, srcPath, destPath);
    }
}

async function generateBuildIniIfNotExists(context: BuildContext){
    if (context.buildIniFile){
        return; // already exists;
    }
    const content = `[Engine.Engine]
EditorEngine=Editor.EditorEngine

[Editor.EditorEngine]
CacheSizeMegs=32
EditPackages=Core
EditPackages=Engine
EditPackages=Editor
EditPackages=UWindow
EditPackages=Fire
EditPackages=IpDrv
EditPackages=UWeb
EditPackages=UBrowser
EditPackages=UnrealShare
EditPackages=UnrealI
EditPackages=UMenu
EditPackages=IpServer
EditPackages=Botpack
EditPackages=UTServerAdmin
EditPackages=UTMenu
EditPackages=UTBrowser
EditPackages=${context.buildName}

[Core.System]
Paths=*.u
Paths=../Maps/*.unr
Paths=../Textures/*.utx
Paths=../Sounds/*.uax
Paths=../Music/*.umx`;
    const iniPath = `${context.buildDir}/auto-generated-make.ini`;
    context.buildIniFile = iniPath;
    await tempWrite(context, iniPath, content);
}

function getProjectRelativePath(context: BuildContext, fullPath: string){
    if (fullPath.startsWith(context.projectDir)){
        return fullPath.substring(context.projectDir.length + 1);
    }
    throw new Error(`Path "${fullPath}" not part of project ${context.projectDir}`);
}

function getBuildPath(context: BuildContext, fullPath: string){
    if (fullPath.startsWith(context.projectDir)){
        return context.buildDir + fullPath.substring(context.projectDir.length);
    }
    throw new Error(`Path "${fullPath}" not part of project ${context.projectDir}`);
}

function getBuildClassesPath(context: BuildContext, fullPath: string){
    if (fullPath.startsWith(context.projectDir)){
        const filename = getFilename(fullPath);
        return context.buildClassesDir + path.sep + filename;
    }
    throw new Error(`Path "${fullPath}" not part of project ${context.projectDir}`);
}

async function generateBuildNameAndDir(gameDir: string): Promise<{ buildName: string, buildDir: string, buildClassesDir: string }> {
    const number = Date.now();
    let error: unknown;
    for (let i=0; i<1000; i++){
        let buildName = `ucx-build-${number + i}`;
        let buildDir = gameDir + "/" + buildName;
        try {
            await fs.mkdir(buildDir);
            buildDir = await fs.realpath(buildDir);
            let buildClassesDir = buildDir + "/Classes";
            await fs.mkdir(buildClassesDir);
            buildClassesDir = await fs.realpath(buildClassesDir);
            return { buildName, buildDir, buildClassesDir };
        }
        catch (err)
        {
            error = err;
        }
    }
    throw error ?? new Error("Failed to generate build name");
}


async function tempMkDir(context: BuildContext, path: string){
    try 
    {
        const dirStat = await fs.stat(path);
        if (dirStat.isDirectory()){
            return; // already exists
        }
    }
    catch 
    {
        // dir does not exists
    }
    await fs.mkdir(path, { recursive: false });
    context.tempToCleanup.push({ fullPath: path, isDir: true });
}

async function tempCopy(context: BuildContext, src: string, dest: string) {
    await fs.copyFile(src, dest, constants.COPYFILE_EXCL);
    context.tempToCleanup.push({ fullPath: dest, isDir: false });
}

async function tempWrite(context: BuildContext, destPath: string, content: string) {
    await fs.writeFile(destPath, content, 'utf-8');
    context.tempToCleanup.push({ fullPath: destPath, isDir: false });
}

async function deleteTemporaryFiles(context: BuildContext) {
    const todo = context.tempToCleanup;
    context.tempToCleanup = [];
    todo.reverse();
    for (const item of todo)
    {
        if (item.isDir){
            await fs.rmdir(item.fullPath);
        } else {
            await fs.unlink(item.fullPath);
        }
    }
}

async function runUccBuildCommand(context: BuildContext): Promise<void> {

    const process = new Subprocess(context.uccPath, 'make');

    if (context.buildIniFile)
    {
        const iniFilename = getFilename(context.buildIniFile);
        const relativeIniPath = ['..', context.buildName, iniFilename].join(context.pathSeparator);
        process.addArgs(`ini="${relativeIniPath}"`);
    }
    
    await process.execCommand();
}

async function copyOutput(c: BuildContext) {
    const uccOutput = `${c.systemDir}${c.pathSeparator}${c.buildName}.u`;
    const requiredOutput = `${c.systemDir}${c.pathSeparator}${c.projectName}.u`;
    await fs.rename(uccOutput, requiredOutput);
}

async function tempTransformSource(context: BuildContext, srcPath: string, destPath: string) {
    const originalSource = await fs.readFile(srcPath, 'utf-8');
    let result = originalSource;
    try 
    {
        result = transform(originalSource);
    }
    catch (error){
        console.error("failed to transform", srcPath);
        console.error("skipping transformation, copying source directly");
        console.error(error);
    }
    await fs.writeFile(destPath, result, 'utf-8');
    context.tempToCleanup.push({ fullPath: destPath, isDir: false });
}

function transform(input: string): string {
    const editor = new SourceEditor(input);
    const uc = parse(input);
    transformFor436(editor, uc);
    return editor.result;
}

function parse(input: string) : UnrealClass {
    const parser = new UcParser();
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            try 
            {
                parser.parse(i, token.position, token.text);
            }
            catch (error)
            {
                // print parsing issue
                console.error('parsing failed at line', i, 
                    'position', token.position);
                console.error('at token', token.text, 'line:', lines[i]);
                throw error; // rethrow
            }
        }
    }
    parser.endOfFile(input.length, 0);
    return parser.result;
}