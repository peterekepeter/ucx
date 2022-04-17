import { UcxCommand } from "../cli";
import * as os from "os";
import { promises as fs, constants } from "fs";
import { exec, spawn } from "child_process";

export async function execBuild(cmd: UcxCommand){
    const projectFolders = await getBuildProjects(cmd.files);
    for (const project of projectFolders){
        const context = await getBuildContext(project, cmd.uccPath);
        await buildProject(context);
    }
}

async function buildProject(context: BuildContext) {
    await visitSourceFolder(context, context.projectDir);
    await runUccBuildCommand(context);
    await copyOutput(context);
    await deleteTemporaryFiles(context);
}

async function getBuildContext(projectDir: string, uccPath: string): Promise<BuildContext> {
    const resolvedPaths = await getUccPath(uccPath);
    const projectName = await getProjectNameFromPath(projectDir);
    const context: BuildContext = {
        tempToCleanup: [],
        projectName,
        projectDir,
        pathSeparator: detectPathSeparator(projectDir),
        ... resolvedPaths,
        ... await generateBuildNameAndDir(resolvedPaths.gameDir),
    };
    console.log('building', projectName, '(', context.buildName, ')');
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
        const uccPathPromise = fs.realpath(inputUccPath);
        const gameDirPromise = fs.realpath(inputUccPath + "/../../");
        const systemDirPromise = fs.realpath(inputUccPath + "/../");
        return {
            uccPath: await uccPathPromise,
            gameDir: await gameDirPromise,
            systemDir: await systemDirPromise,
        };
    }
    catch (error){
        throw new Error(`UCC path is required, "${inputUccPath}" not valid path`);
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
    buildDir: string
    buildName: string;
    buildIniFile?: string
    tempToCleanup: { fullPath: string, isDir: boolean }[];
}


async function visitSourceFolder(context: BuildContext, dirPath: string) {
    const outName = getBuildPath(context, dirPath);
    const projectRelativeDir = getProjectRelativePath(context, dirPath);
    await tempMkDir(context, outName);


    for (const item of await fs.readdir(dirPath)){
        const fullPath = `${dirPath}${context.pathSeparator}${item}`;
        const stat = await fs.stat(fullPath);
        if (item.startsWith('.')){
            return; // ignore
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
    const destPath = getBuildPath(context, srcPath);
    // console.log('COPY',relativePath);
    if (srcPath.endsWith('.ini')){
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
        };
    } 
    
    await tempCopy(context, srcPath, destPath);
}

function detectPathSeparator(path: string): string {
    if (path.indexOf('\\') !== -1){
        return "\\";
    }
    return "/";
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

async function generateBuildNameAndDir(gameDir: string): Promise<{ buildName: string, buildDir: string }> {
    const number = Math.floor(Math.random()*80000+10000);
    let error: unknown;
    for (let i=0; i<1000; i++){
        let buildName = `ucx-build-${number + i}`;
        let buildDir = gameDir + "/" + buildName;
        try {
            await fs.mkdir(buildDir);
            buildDir = await fs.realpath(buildDir);
            await fs.rmdir(buildDir);
            return { buildName, buildDir };
        }
        catch (err)
        {
            error = err;
        }
    }
    throw error ?? new Error("Failed to generate build name");
}


async function tempMkDir(context: BuildContext, path: string){
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
    for (const item of todo){
        // console.log("DELETE", item.fullPath);
        if (item.isDir){
            await fs.rmdir(item.fullPath);
        } else {
            await fs.unlink(item.fullPath);
        }
    }
}

function runUccBuildCommand(context: BuildContext): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('spawning', context.uccPath);
        exec(`"${context.uccPath}" make ini="${context.buildIniFile}"`, {

        }, (error, stdout, stderr) => {
            console.log(stdout);
            // console.error(stderr);
            if (error){
                reject(error);
            }
            else {    
                resolve();
            }
        });
    });
    
}

async function copyOutput(c: BuildContext) {
    const uccOutput = `${c.systemDir}${c.pathSeparator}${c.buildName}.u`;
    const requiredOutput = `${c.systemDir}${c.pathSeparator}${c.projectName}.u`;
    await fs.rename(uccOutput, requiredOutput);
}