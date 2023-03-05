
export function detectPathSeparator(path: string): string {
    if (path.indexOf('\\') !== -1){
        return "\\";
    }
    return "/";
}

export function getFilename(filePath: string): string {
    const lastSlash = Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/"));
    if (lastSlash === -1){
        throw new Error(`Cannot get filename of "${filePath}"`);
    }
    return filePath.substring(lastSlash + 1);
}

export function pathUpOneLevel(input: string, separator: string): string 
{
    const lastIndex = input.lastIndexOf(separator);
    return input.substring(0, lastIndex);
}