import { Observable } from 'rxjs';
export interface IStoreOptions {
    logOnChange?: boolean;
}
export declare class Store<T extends {
    [key: string]: any[];
}> {
    private _options;
    private _observables;
    private _registeredActions;
    constructor(state: T, options?: IStoreOptions);
    /**
     * gets an observable for the specified store state value, if the state value is not found returns null
     * @param name name of the property to observe from the store state
     */
    observable<S>(name: string): Observable<IStoreActionResult<S>>;
    /**
     * registers an action which can be executed to update store values. actions with the same name are not allowed
     * @param action action to register with the store
     */
    registerAction<U>(action: IStoreAction<T, U>): void;
    /**
     * calls the named action with the specified arguments in order of which they are supplied
     * @param name name of the action to execute
     * @param args any number of arguments to pass to the specified action
     */
    executeAction<S>(name: string, ...args: any[]): Promise<IStoreActionResult<S>>;
    /**
     * gets the current value from the store if it exists (not null and length > 1), otherwise performs the specified action
     * @param name name of the action to execute
     * @param args args to pass to the action
     */
    getOrExecuteAction<S extends any[]>(name: string, ...args: any[]): Promise<IStoreActionResult<S>>;
    /**
     * gets the current value of the given state property name from the store
     * @param propertyName name of the value to retrieve from the store
     */
    get<S extends any[]>(name: string): S;
    private getCurrentState;
    private notifyObservers;
    private logContents;
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
export declare enum StoreActionType {
    NONE = 0,
    RESET = 1,
    ADD = 2,
    REMOVE = 3,
    UPDATE = 4
}
