var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "clone", "rxjs"], function (require, exports, clone_1, rxjs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    clone_1 = __importDefault(clone_1);
    class Store {
        constructor(state) {
            this._observables = [];
            this._registeredActions = [];
            Object.keys(state).forEach((p) => {
                let observable = rxjs_1.Observable.create((observer) => {
                    let obs = this._observables.find((o) => {
                        return o.key === p;
                    });
                    if (obs != null) {
                        obs.observers.push(observer);
                    }
                });
                let observers = [];
                this._observables.push({
                    observable: observable,
                    observers: observers,
                    key: p,
                    value: clone_1.default(state[p]) || null
                });
            });
        }
        /**
         * gets an observable for the specified store state value, if the state value is not found returns null
         * @param name name of the property to observe from the store state
         */
        observable(name) {
            let pObs = this._observables.find((obs) => {
                return obs.key === name;
            });
            if (pObs != null) {
                return pObs.observable;
            }
            return null;
        }
        /**
         * registers an action which can be executed to update store values. actions with the same name are not allowed
         * @param action action to register with the store
         */
        registerAction(action) {
            if (this._registeredActions.find((e) => e.name === action.name) == null) {
                this._registeredActions.push(action);
                if (Store.prototype.hasOwnProperty(action.name) === false) {
                    Store.prototype[action.name] = (...args) => {
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
        async executeAction(name, ...args) {
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
                    let cloned = clone_1.default(result);
                    if (cloned.action !== StoreActionType.NONE) {
                        pObs.value = clone_1.default(result.value);
                        this.notifyObservers(pObs.observers, cloned);
                    }
                    return cloned;
                }
            }
            else {
                throw new Error(`${name} not registered`);
            }
        }
        /**
         * gets the current value from the store if it exists (not null and length > 1), otherwise performs the specified action
         * @param name name of the action to execute
         * @param args args to pass to the action
         */
        async getOrExecuteAction(name, ...args) {
            let ra = this._registeredActions.find((a) => {
                return a.name === name;
            });
            if (ra != null) {
                let property = ra.property;
                let result = this.get(property);
                if (result == null || (result instanceof Array && result.length === 0)) {
                    return this.executeAction(name, ...args);
                }
                else {
                    return {
                        value: result,
                        action: StoreActionType.NONE
                    };
                }
            }
            else {
                throw new Error(`${name} not registered`);
            }
        }
        /**
         * gets the current value of the given state property name from the store
         * @param propertyName name of the value to retrieve from the store
         */
        get(name) {
            let found = null;
            this._observables.forEach((obs) => {
                if (obs.key === name) {
                    found = clone_1.default(obs.value);
                }
            });
            return found;
        }
        getCurrentState() {
            let state = {};
            this._observables.forEach((obs) => {
                state[obs.key] = clone_1.default(obs.value);
            });
            return state;
        }
        notifyObservers(observers, value) {
            observers.forEach((o) => {
                o.next(value);
            });
        }
    }
    exports.Store = Store;
    var StoreActionType;
    (function (StoreActionType) {
        StoreActionType[StoreActionType["NONE"] = 0] = "NONE";
        StoreActionType[StoreActionType["RESET"] = 1] = "RESET";
        StoreActionType[StoreActionType["ADD"] = 2] = "ADD";
        StoreActionType[StoreActionType["REMOVE"] = 3] = "REMOVE";
        StoreActionType[StoreActionType["UPDATE"] = 4] = "UPDATE";
    })(StoreActionType = exports.StoreActionType || (exports.StoreActionType = {}));
});

//# sourceMappingURL=Store.js.map
