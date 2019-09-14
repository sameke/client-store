export class Mutex {
    private _mutex = Promise.resolve();

    public lock(): PromiseLike<() => void> {
        let begin: (unlock: () => void) => void = (unlock) => { };

        this._mutex = this._mutex.then(() => {
            return new Promise(begin);
        });

        return new Promise((res) => {
            begin = res;
        });
    }

    public async dispatch<T>(fn: (() => T) | (() => PromiseLike<T>)): Promise<T> {
        const unlock = await this.lock();
        try {
            return await Promise.resolve(fn());
        } finally {
            unlock();
        }
    }
}