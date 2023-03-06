//@ts-ignore
import { version } from '../../../package.json';

export async function execVersion(): Promise<void> {
    console.log(await getVersion());
}

async function getVersion(): Promise<string> {
    return version;
}