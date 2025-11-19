import { concurrentMap } from './concurrentMap';
import { delay } from './delay';


describe(concurrentMap, () => {

    test('returns mapped one elmenet', async () => {
        expect(await concurrentMap([1], 
            (x) => Promise.resolve(x*2))).toEqual([2]);
    })

    test('returns mapped array', async () => {
        expect(await concurrentMap([1,2,3], 
            (x) => Promise.resolve(x*2))).toEqual([2,4,6]);
    })

    test('order is same as input', async () => {
        expect(await concurrentMap([1,2,3], async f => {
            await delay(4-f);
            return f * 3;
        })).toEqual([3,6,9]);
    })

    test('already cancelled', async () => {
        const cancellation = { isCancellationRequested: true };
        expect(await concurrentMap(
            [1], 
            (x) => Promise.resolve(x*42), 
            1, 
            cancellation,
        )).toEqual([undefined]);
    })

    test('can be canceled', async () => {
        const cancellation = { isCancellationRequested: false }
        const promise = concurrentMap([1,2,3], f=>delay(1).then(()=>f*4), 1, cancellation);
        cancellation.isCancellationRequested = true;
        expect(await promise).toEqual([4, undefined, undefined])
    })

    test('do not schedule rest when error', async () => {
        let run = 0;
        await expect(concurrentMap(
            [1,2,3,4,5],
            i => {
                run += 1;
                return i === 3 ? Promise.reject("oops!") : Promise.resolve(i);
            },
            1,
        )).rejects.toBeTruthy();
        expect(run).toBe(3);
    })

});
