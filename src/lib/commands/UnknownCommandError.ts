
export class UnknownCommandError extends Error {
    constructor(message: string){
        super(message);
    }
}