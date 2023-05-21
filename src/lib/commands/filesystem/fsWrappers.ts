import { promises as fs } from 'fs';

export async function getFileContent(path: string){
    const content = await fs.readFile(path, 'utf-8');
    return content;
}