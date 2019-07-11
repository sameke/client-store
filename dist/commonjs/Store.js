"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const rxjs_1 = require("rxjs");
class Store {
    constructor(state, options) {
        this._observables = [];
        this._registeredActions = [];
        this._options = options || {};
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
     * @param statePropertyName name of the property to observe from the store state
     */
    observable(statePropertyName) {
        let pObs = this._observables.find((obs) => {
            return obs.key === statePropertyName;
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
                    if (this._options.logOnChange === true) {
                        this.logContents();
                    }
                }
                return cloned;
            }
        }
        else {
            throw new Error(`${name} not registered`);
        }
    }
    /**
     * gets the current value from the store if it exists, otherwise performs the specified action
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
    get(propertyName) {
        let found = null;
        this._observables.forEach((obs) => {
            if (obs.key === propertyName) {
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
    logContents() {
        for (let observable of this._observables) {
            console.log(observable.key);
            console.log(observable.value);
        }
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

//# sourceMappingURL=Store.js.map
