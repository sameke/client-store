import { Observable } from 'rxjs';
export interface IStoreOptions {
    logOnChange?: boolean;
}
export declare class Store<T extends {
    [key: string]: any;
}> {
    private _options;
    private _observables;
    private _registeredActions;
    constructor(state: T, options?: IStoreOptions);
    observable<S>(stateProperty: string): Observable<IStoreActionResult<S>>;
    registerAction<U>(action: IStoreAction<T, U>): void;
    executeAction<S>(name: string, ...args: any[]): Promise<IStoreActionResult<S>>;
    getOrExecuteAction<S>(name: string, ...args: any[]): Promise<IStoreActionResult<S>>;
    get<S>(propertyName: string): S;
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
    affectedItem?: any;
    /**
     * data source from which the store was modified
     */
    source?: any;
}
export declare enum StoreActionType {
    NONE = 0,
    RESET = 1,
    ADDED = 2,
    REMOVED = 3,
    UPDATED = 4
}
