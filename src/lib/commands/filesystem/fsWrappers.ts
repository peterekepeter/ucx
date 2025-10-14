import { promises as fs } from 'node:fs';

export async function getFileContent(path: string){
    const content = await fs.readFile(path, 'utf-8');
    return content;
}

export const lstat = fs.lstat;

export const realpath = fs.realpath;

export const readdir = fs.readdir;

export const stat = fs.stat;

export const readFile = fs.readFile;

export const mkdir = fs.mkdir;

export const copyFile = fs.copyFile;

export const COPYFILE_EXCL = fs.constants.COPYFILE_EXCL;

export const writeFile = fs.writeFile;

export const rmdir = fs.rmdir;

export const unlink = fs.unlink;

export const rename = fs.rename;