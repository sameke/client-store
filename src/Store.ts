import clone from 'clone';
import { Observable, Observer } from 'rxjs';
import { Lock } from './Lock';

export interface IStoreOptions {
    logOnChange?: boolean;
}

export class Store<T extends { [key: string]: any }> {
    private readonly _locks: {
        [key: string]: Lock
    } = {};
    private readonly _observables: Array<{
        key: string,
        observable: Observable<IStoreActionResult<any>>,
        observers: Array<Observer<IStoreActionResult<any>>>,
        value: any
    }> = [];
    private readonly _registeredActions: Array<IStoreAction<T, any>> = [];
    private _options: IStoreOptions;

    public constructor(state: T, options?: IStoreOptions) {
        this._options = options || {};

        Object.keys(state).forEach((p: string) => {
            let observable = Observable.create((observer: Observer<IStoreActionResult<any>>) => {
                let obs = this._observables.find((o) => {
                    return o.key === p;
                });
                if (obs != null) {
                    obs.observers.push(observer);
                }
            });
            let observers: Array<Observer<IStoreActionResult<any>>> = [];

            this._observables.push({
                observable: observable,
                observers: observers,
                key: p,
                value: clone(state[p]) || null
            });
        });
    }

    /**
     * gets an observable for the specified store state value, if the state value is not found returns null
     * @param statePropertyName name of the property to observe from the store state
     */
    public observable<S>(statePropertyName: string): Observable<IStoreActionResult<S>> {
        let pObs = this._observables.find((obs) => {
            return obs.key === statePropertyName;
        });

        if (pObs != null) {
            return pObs.observable as Observable<IStoreActionResult<S>>;
        }

        return null;
    }

    /**
     * registers an action which can be executed to update store values. actions with the same name are not allowed
     * @param action action to register with the store
     */
    public registerAction<U>(action: IStoreAction<T, U>) {
        if (this._registeredActions.find((e) => e.name === action.name) == null) {
            this._registeredActions.push(action);
        }
    }

    /**
     * calls the named action with the specified arguments in order of which they are supplied
     * @param name name of the action to execute
     * @param args any number of arguments to pass to the specified action
     */
    public async executeAction<S>(name: string, ...args: any[]): Promise<IStoreActionResult<S>> {
        let ra = this._registeredActions.find((a) => {
            return a.name === name;
        });

        if (ra != null) {
            let pObs = this._observables.find((obs) => {
                return obs.key === ra.property;
            });

            if (pObs != null) {
                let result = await ra.action(this.getCurrentState(), ...args);
                // clone so that store value cannot be modified
                let cloned = clone(result);

                if (cloned.action !== StoreActionType.NONE) {
                    pObs.value = clone(result.value);
                    this.notifyObservers(pObs.observers, cloned);
                }

                return cloned;
            }
        } else {
            throw new Error(`${name} not registered`);
        }
    }

    /**
     * gets the current value from the store if it exists, otherwise performs the specified action
     * @param name name of the action to execute
     * @param args args to pass to the action
     */
    public async getOrExecuteAction<S>(name: string, ...args: any[]): Promise<IStoreActionResult<S>> {
        let ra = this._registeredActions.find((a) => {
            return a.name === name;
        });

        if (ra != null) {
            let property = ra.property;

            let result = this.get<S>(property);
            if (result == null || (result instanceof Array && result.length === 0)) {
                let lock = this._locks[name];
                if (lock == null) {
                    lock = new Lock();
                    this._locks[name] = lock;
                }

                if (lock.isLocked === false) {
                    let release = lock.lock();
                    return this.executeAction<S>(name, ...args).then((res) => {
                        release();
                        return res;
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        lock.on('release', () => {
                            resolve(this.getOrExecuteAction<S>(name, ...args));
                        });
                    }) as Promise<IStoreActionResult<S>>;
                }
            } else {
                return {
                    value: result,
                    action: StoreActionType.NONE
                } as IStoreActionResult<S>;
            }
        } else {
            throw new Error(`${name} not registered`);
        }
    }

    public get<S extends any>(propertyName: string): S {
        let found = null;
        this._observables.forEach((obs) => {
            if (obs.key === propertyName) {
                found = clone(obs.value);
            }
        });

        return found;
    }

    private getCurrentState(): T {
        let state = {} as T;
        this._observables.forEach((obs) => {
            (state as any)[obs.key] = clone(obs.value);
        });

        return state;
    }

    private notifyObservers<S>(observers: Array<Observer<IStoreActionResult<S>>>, value: IStoreActionResult<S>) {
        observers.forEach((o) => {
            o.next(value);
        });
    }
}

export interface IStoreAction<T, S> {
    name: string;
    property: string;
    action: (storeState: T, ...params: any[]) => Promise<IStoreActionResult<S>>;
}

export interface IStoreActionResult<T> {
    /**
     * value which will be set in the store for the property specified by the action
     */
    value: T;

    /**
     * action type
     */
    action: StoreActionType;

    /**
     * actual element which was affected by the store action
     */
    target?: any;

    /**
     * data source from which the store was modified
     */
    source?: any;
}

export enum StoreActionType {
    NONE,
    RESET,
    ADD,
    REMOVE,
    UPDATE
}