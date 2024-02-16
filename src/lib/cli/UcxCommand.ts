
export const DEFAULT_UCX_COMMAND = {
    errors: [] as string[],
    files: [] as string[],
    jsInterpreter: '',
    uccPath: '',
    ucxScript: '',
    command: '',
    noClean: false,
    quiet: false,
    verbose: false,
    noPackageMangle: true,
};

export type UcxCommand = typeof DEFAULT_UCX_COMMAND;
