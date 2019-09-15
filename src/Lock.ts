import { EventEmitter } from 'events';

export class Lock extends EventEmitter {
    private _isLocked: boolean = false;

    public get isLocked() {
        return this._isLocked;
    }

    public lock(): () => void {
        this._isLocked = true;
        return () => {
            this._isLocked = false;
            this.emit('release');
            this.removeAllListeners();
        };
    }
}