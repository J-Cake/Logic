export function attempt(fn: () => Promise<any>, fail?: (err: any) => void): Promise<boolean> {
    return new Promise(function (resolve) {
        try {
            fn().then(() => resolve(false)).catch(err => {
                if (fail)
                    fail(err);
                resolve(true);
            });
        } catch (err) {
            if (fail)
                fail(err);
            resolve(true);
        }
    });
}

export function attemptSync(fn: () => any, fail?: (err: any) => void): boolean {
    try {
        fn();
        return false
    } catch (err) {
        if (fail)
            fail(err);
        return true;
    }
}

export function Try<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise(function (resolve, reject) {
        try {
            fn().then(res => resolve(res)).catch(err => {
                reject(err);
            });
        } catch (err) {
            reject(null);
        }
    });
}

export const xor = (a: boolean, b: boolean): boolean => !(a && b) && (a || b);