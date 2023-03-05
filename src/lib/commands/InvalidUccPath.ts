export class InvalidUccPath extends Error{
    constructor(message: string, public inner: unknown) {
        super(message);
    }
}
