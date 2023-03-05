import os = require("os");

export enum PlatformType {
    Win32,
    Linux,
    Wine
}

export function detectPlatform(exePath:string): PlatformType {
    const platform = os.platform();
    if (platform === "win32")
    {
        return PlatformType.Win32;
    }
    else if (exePath.endsWith(".exe")){
        return PlatformType.Wine;
    }
    else {
        return PlatformType.Linux;
    }
}
