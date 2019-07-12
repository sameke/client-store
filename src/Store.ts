import { default as clone } from 'clone';
import { Observable, Observer } from 'rxjs';

export class Store<T extends { [key: string]: any[] }> {
    private _observables: Array<{
        key: string,
        observable: Observable<IStoreActionResult<any>>,
        observers: Array<Observer<IStoreActionResult<any>>>,
        value: any
    }> = [];

    private readonly _registeredActions: Array<IStoreAction<T, any>> = [];

    public constructor(state: T) {
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
     * @param name name of the property to observe from the store state
     */
    public observable<S>(name: string): Observable<IStoreActionResult<S>> {
        let pObs = this._observables.find((obs) => {
            return obs.key === name;
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
            if ((Store.prototype as any).hasOwnProperty(action.name) === false) {
                (Store.prototype as any)[action.name] = (...args: any[]) => {
                    this.executeAction(action.name, ...args);
                };
            }
        }
    }

    /**
     * calls the named action with the specified arguments in order of which they are supplied
     * @param name name of the action to execute
     * @param args any number of arguments to pass to the specified action
     */
    public async executeAction<S extends any[]>(name: string, ...args: any[]): Promise<IStoreActionResult<S>> {
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
     * gets the current value from the store if it exists (not null and length > 1), otherwise performs the specified action
     * @param name name of the action to execute
     * @param args args to pass to the action
     */
    public async getOrExecuteAction<S extends any[]>(name: string, ...args: any[]): Promise<IStoreActionResult<S>> {
        let ra = this._registeredActions.find((a) => {
            return a.name === name;
        });
        if (ra != null) {
            let property = ra.property;

            let result = this.get<S>(property);
            if (result == null || (result instanceof Array && result.length === 0)) {
                return this.executeAction<S>(name, ...args);
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

    /**
     * gets the current value of the given state property name from the store
     * @param propertyName name of the value to retrieve from the store
     */
    public get<S extends any[]>(name: string): S {
        let found = null;
        this._observables.forEach((obs) => {
            if (obs.key === name) {
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