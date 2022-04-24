

/**
 * Applies edits to source
 */
export class SourceEditor
{   
    sourceLines: string[];
    edits: { position: number, length: number, text: string }[][];

    constructor(source: string){
        this.sourceLines = source.split('\n');
        this.edits = this.sourceLines.map(line => []);
    }

    replace(line: number, position: number, replaceLength: number, withText: string){
        this.edits[line].push({ position, length: replaceLength, text: withText });
    }

    insert(line: number, position: number, text: string)
    {
        this.replace(line, position, 0, text);
    }

    remove(line: number, position: number, length: number)
    {
        this.replace(line, position, length, '');
    }

    get result()
    {
        const resultLines: string[] = [];
        for (let i=0; i<this.sourceLines.length; i++){
            let sourceLine = this.sourceLines[i];
            const lineEdits = this.edits[i];
            lineEdits.sort((a,b) => b.position - a.position);
            for (const edit of lineEdits){
                sourceLine = this.applyLineEdit(sourceLine, edit);
            }
            resultLines.push(sourceLine);
        }
        return resultLines.join('\n');
    }

    private applyLineEdit(input: string, edit: SourceEditor['edits'][0][0]){
        return input.substring(0, edit.position) + 
            edit.text + 
            input.substring(edit.position + edit.length);
    }
}