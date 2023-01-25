var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DummyDataProxy } from './DataProxy';
const internalModelProps = ['_dirtyProps', '_rollbackMode', '_isPhantom', '_isDestroyed', '_className', '_queryParams'];
/**
 * The Proxy Handler intercepts behaviour of the model:
 * it sets up "trap" functions to intercept interactions:
 *
 * set: When setting a property, we check if it is defined, apply mutations,
 *      and store the original value for dirty checking / rolling back.
 */
const proxyHandler = {
    set(target, prop, newValue, receiver) {
        // model-internal values just get set:
        if (internalModelProps.includes(prop)) {
            target[prop] = newValue;
            return true;
        }
        // all other props: we keep the original value in the _dirtyProps store, to indicate
        // dirty / changed values
        // Also, if a mutation for a property is defined, apply it before setting the value.
        // saving original value in _dirtyProps, for later rollback / dirty check:
        if (!Object.keys(target._dirtyProps).includes(prop)) {
            target._dirtyProps[prop] = target[prop];
        }
        // apply mutation, if not in rollback mode: available:
        if (target._rollbackMode !== true) {
            const mut = target.mutations();
            if (Object.keys(mut).includes(prop) && typeof mut[prop] === 'function') {
                const mutFn = mut[prop];
                newValue = mutFn.apply(receiver, [newValue]);
            }
        }
        target[prop] = newValue;
        return true;
    },
};
export default class Model {
    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    getDataProxy() {
        return new DummyDataProxy();
    }
    constructor() {
        this._queryParams = {};
        /** set to true during rollback: this allows the proxy to skip certain modifications */
        this._rollbackMode = false;
        /** if true, it is still an in-memory-only record: it was not saved yet. */
        this._isPhantom = true;
        /** if true, this model instance was deleted using destroy(). */
        this._isDestroyed = false;
        this._className = '';
        this._className = this.constructor.name;
        this._dirtyProps = {};
        // set up and return the proxy object:
        const proxyThis = new Proxy(this, proxyHandler);
        proxyThis.commit();
        return proxyThis;
    }
    /**
     * Returns the class name of this model
     * Note that you *SHOULD* override this method in child classes if you need
     * it for e.g. backend entity naming.
     *
     * *WARNING*: The default class name function is NOT reliable: it depends on
     * the constructor function's name, which can change if the code is minified!
     * So you should ALWAYS override this method!
     */
    getClassName() {
        console.warn('default getClassName() method used: This is unreliable. Override it with your own implementation.');
        return this._className;
    }
    set(keyOrData, data) {
        if (typeof keyOrData === 'string') {
            Object.assign(this, { [keyOrData]: data });
        }
        else if (typeof keyOrData === 'object') {
            Object.assign(this, keyOrData);
        }
        return this;
    }
    get(key) {
        for (const [k, val] of Object.entries(this)) {
            if (k === key) {
                return val;
            }
        }
        return undefined;
    }
    mutations() {
        return {};
    }
    isDirty() {
        return Object.keys(this._dirtyProps).length > 0;
    }
    commit(data) {
        if (data) {
            this.set(data);
        }
        this._dirtyProps = {};
        return this;
    }
    rollback() {
        this._rollbackMode = true;
        Object.assign(this, this._dirtyProps);
        this._dirtyProps = {};
        this._rollbackMode = false;
        return this;
    }
    /**
     * Phantom means the record only exists in memory, so was neither load or stored from/to a backend.
     *
     * @returns true if this is a new, unsaved record, false if it was loaded or saved to/from a backend
     */
    isPhantom() {
        return this._isPhantom;
    }
    /**
     * Seths the phantom state of this model. Use with caution:
     * normally this is handled by the framework, so only use if you know what you are doing!
     *
     * @param isPhantom The phantom state (true for new (= phantom))
     */
    setPhantom(isPhantom) {
        this._isPhantom = isPhantom;
    }
    isDestroyed() {
        return this._isDestroyed;
    }
    /**
     * Loads the record from a backend.
     * This operation is handed over to the configured
     * DataProxy.fetch, which you must configure by implementing
     * getDataProxy(): DataProxy.
     *
     * How the loading is done is completely up to the DataProxy.
     * The goal is that the actual instance's data is somehow fetched from a backend
     * and set on the instance. This normally means that the id to load needs
     * to be set already, elgl like this:
     * model.set('id', 5).load()
     */
    load(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.getDataProxy().fetch(this, Object.assign(Object.assign({}, this.queryParams), queryParams));
            if (res) {
                this.set(res);
            }
            this.commit();
            this._isPhantom = false;
            this._isDestroyed = false;
            return this;
        });
    }
    /**
     * Saves the record to a data backend.
     * This operation is handed over to the configured
     * DataProxy.create (for phantom records) or DataProxy.update (for non-phantom records).
     *
     * How the storing is done is completely up to the DataProxy.
     * The goal is that the actual instance's data is somehow stored to a backend.
     * It is up to the DataProxy to identify the record (by id, e.g), and update its data after
     * the store returns some new data.
     */
    save(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            let res;
            if (this.isPhantom()) {
                res = yield this.getDataProxy().create(this, Object.assign(Object.assign({}, this.queryParams), queryParams));
            }
            else {
                res = yield this.getDataProxy().update(this, Object.assign(Object.assign({}, this.queryParams), queryParams));
            }
            if (res) {
                this.set(res);
            }
            this.commit();
            this._isPhantom = false;
            this._isDestroyed = false;
            return this;
        });
    }
    destroy(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isPhantom()) {
                const res = yield this.getDataProxy().delete(this, Object.assign(Object.assign({}, this.queryParams), queryParams));
                if (res) {
                    this.set(res);
                    this.commit();
                }
                this._isPhantom = true;
                this._isDestroyed = true;
            }
            return this;
        });
    }
    getDirtyProps() {
        const dirty = Object.assign({}, this._dirtyProps);
        Object.keys(dirty).forEach((key) => {
            dirty[key] = this.get(key);
        });
        return dirty;
    }
    getProps() {
        const props = {};
        // read standard props:
        Object.keys(this)
            .filter((k) => !internalModelProps.includes(k))
            .forEach((k) => {
            Reflect.set(props, k, this.get(k));
        });
        // read getter props:
        const protoProps = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this));
        for (const prop in protoProps) {
            if (protoProps[prop].get) {
                Reflect.set(props, prop, Reflect.get(this, prop));
            }
        }
        return props;
    }
    toJSON() {
        return this.getProps();
    }
    /**
     * Sets a permanent query param: Permanent query params are added to all query() calls.
     *
     * @param key The param name, e.g. 'filter'
     * @param value The query param value, e.g. 'id=3'
     * @returns this
     */
    setQueryParam(key, value) {
        this._queryParams[key] = value;
        return this;
    }
    /**
     * Sets multiple permanent query params: Permanent query params are added to all query() calls.
     *
     * @param params Multiple query params as object, e.q. {filter: 'id=1', order: 'name'}
     * @returns this
     */
    setQueryParams(params) {
        this._queryParams = Object.assign(Object.assign({}, this._queryParams), params);
        return this;
    }
    /**
     * Removes a permanent query param: Permanent query params are added to all query() calls.
     *
     * @param key The query param name to be removed from the set of permanent queries
     * @returns this
     */
    removeQueryParam(key) {
        delete this._queryParams[key];
        return this;
    }
    /**
     * The set of permanent query params. Permanent query params are added to all query() calls.
     */
    get queryParams() {
        return Object.assign({}, this._queryParams);
    }
}
//# sourceMappingURL=Model.js.map