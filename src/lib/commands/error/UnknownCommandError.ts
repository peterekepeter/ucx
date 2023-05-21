
export class UnknownCommandError extends Error {
    constructor(
        message: string,
        public knownCommands: string[]
    ){
        super(message);
    }
}

