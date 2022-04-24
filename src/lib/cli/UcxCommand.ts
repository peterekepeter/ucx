export interface UcxCommand {
    jsInterpreter: string;
    ucxScript: string;
    files: string[];
    command: string;
    errors: string[];
    uccPath: string;
    noClean: boolean;
}

export const DEFAULT_UCX_COMMAND = {
    errors: [],
    files: [],
    jsInterpreter: '',
    uccPath: '',
    ucxScript: '',
    command: '',
    noClean: false,
} as UcxCommand;