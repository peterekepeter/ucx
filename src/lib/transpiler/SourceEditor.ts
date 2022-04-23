

/**
 * Applies edits to source
 */
export class SourceEditor
{
    constructor(private _source: string){
    }

    insert(line: number, position: number, text: string)
    {
        this._source = this._source.substring(0, position) + 
            text + 
            this._source.substring(position);
    }

    remove(line: number, position: number, length: number)
    {
        this._source = this._source.substring(0, position) + 
            this._source.substring(position + length)
    }

    get result()
    {
        return this._source;
    }
}