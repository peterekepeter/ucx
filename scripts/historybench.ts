import * as child from 'node:child_process';
import * as fs from 'node:fs';

const srcdirkey = 'BENCH_SRC_DIR';
const runcountkey = 'BENCH_RUNS';
const srcdir = process.env[srcdirkey] ?? '';
const runcount = Number(process.env[runcountkey] ?? '1') || 1;

if (!srcdir) {
    console.log('please set env var', srcdirkey, 'to source folder to benchmark on');
    process.exit(1);
}

if (!fs.existsSync(srcdir))
{
    console.log(srcdir, 'does not exit, src dir via', srcdirkey);
    process.exit(1);
}

console.log('benchmarking', srcdir, 'with', runcount, 'runs per commit');

const gitlog = child.execSync('git log master --oneline').toString();

const commits: [string,string][] = gitlog
    .split('\n')
    .map(l => [
        l.slice(0, l.indexOf(' ')), 
        l.slice(l.indexOf(' ') + 1)
    ]);

const ucxjs = './out/ucx.js';

for (const [hash, message] of commits)
{

    if (fs.existsSync(ucxjs))
        fs.unlinkSync(ucxjs);

    let version = "?.?.?";
        
    try 
    {
        child.execSync('git checkout ' + hash, { stdio: 'ignore' });
        child.execSync('npm run esbuild-ucx', { stdio: 'ignore' });
        version = JSON.parse(fs.readFileSync('package.json').toString())["version"];
    }
    catch (err)
    {
        console.log('exiting due to error', err);
        break;
    }

    if (!fs.existsSync(ucxjs)) 
    {
        console.log('exiting build not found');
        break;
    }

    const maxruns = runcount;
    const runs: number[] = [];
    for (let i=0; i<maxruns; i+=1)
    {
        const start = Date.now();
        try 
        {
            const result = child.execSync('node ./out/ucx.js lint --quiet "'+srcdir+'"').toString();
        }
        catch {
            // noop
        }
        const taken = Date.now() - start;
        runs.push(taken);
    }
    runs.sort((a,b) => a - b);
    const part = runs.slice(Math.floor(maxruns*1/4),Math.ceil(maxruns*3/4));
    const avg = part.reduce((a,b) => a+b) / part.length;

    console.log([
        hash, version, Math.round(avg), JSON.stringify(message)
    ].join('\t'));

}
