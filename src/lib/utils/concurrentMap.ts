
const neverCancel = { isCancellationRequested:false }

export function concurrentMap<T,Y>(
    data: T[], 
    f: (t: T) => Promise<Y>,
    maxConcurrency = 4,
    cancellation: { isCancellationRequested: boolean } = neverCancel) 
{
    return new Promise((resolve, reject) => {
        let results: Y[] = new Array(data.length);
        let finished = 0;

        if (cancellation.isCancellationRequested){
            resolve(results);
            return;
        }

        if (data.length < maxConcurrency) {
            maxConcurrency = data.length;
        }
        
        let remainder = data.length - maxConcurrency;
        let next = maxConcurrency;

        const schedule = (idx: number) => {
            f(data[idx]).then((result) => {
                results[idx] = result;
                finished += 1;
                if (cancellation.isCancellationRequested)
                {
                    resolve(results);
                }
                else {
                    if (remainder > 0) {
                        remainder -= 1;
                        schedule(next++);
                    }
                    if (finished >= data.length) {
                        resolve(results);
                    }
                }
            }).catch(reject);
        }

        for (let i=0; i<maxConcurrency; i+=1)
        {
            schedule(i);
        }
    })
}