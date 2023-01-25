import DataProxy, { DummyDataProxy } from './DataProxy';
import { PropertiesObject, MutationsObject, QueryParams } from './SharedTypes';

const internalModelProps = ['_dirtyProps', '_rollbackMode', '_isPhantom', '_isDestroyed', '_className', '_queryParams'];

/**
 * The Proxy Handler intercepts behaviour of the model:
 * it sets up "trap" functions to intercept interactions:
 *
 * set: When setting a property, we check if it is defined, apply mutations,
 *      and store the original value for dirty checking / rolling back.
 */
const proxyHandler = {
    set(target: PropertiesObject, prop: string, newValue: any, receiver: any): boolean {
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

export default abstract class Model {
    private _dirtyProps: PropertiesObject;
    protected _queryParams: QueryParams = {};

    /** set to true during rollback: this allows the proxy to skip certain modifications */
    private _rollbackMode = false;

    /** if true, it is still an in-memory-only record: it was not saved yet. */
    private _isPhantom = true;

    /** if true, this model instance was deleted using destroy(). */
    private _isDestroyed = false;

    private _className = '';

    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    public getDataProxy(): DataProxy {
        return new DummyDataProxy();
    }

    public constructor() {
        this._className = this.constructor.name;
        this._dirtyProps = {};

        // set up and return the proxy object:
        const proxyThis = new Proxy(this, proxyHandler as ProxyHandler<this>);
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
    public getClassName(): string {
        console.warn(
            'default getClassName() method used: This is unreliable. Override it with your own implementation.',
        );
        return this._className;
    }

    public set(keyOrData: string | PropertiesObject, data?: any): this {
        if (typeof keyOrData === 'string') {
            Object.assign(this, { [keyOrData]: data });
        } else if (typeof keyOrData === 'object') {
            Object.assign(this, keyOrData);
        }
        return this;
    }

    public get(key: string): any {
        for (const [k, val] of Object.entries(this)) {
            if (k === key) {
                return val;
            }
        }
        return undefined;
    }

    public mutations(): MutationsObject {
        return {};
    }

    public isDirty() {
        return Object.keys(this._dirtyProps).length > 0;
    }

    public commit(data?: PropertiesObject): this {
        if (data) {
            this.set(data);
        }
        this._dirtyProps = {};
        return this;
    }

    public rollback(): this {
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
    public isPhantom(): boolean {
        return this._isPhantom;
    }

    /**
     * Seths the phantom state of this model. Use with caution:
     * normally this is handled by the framework, so only use if you know what you are doing!
     *
     * @param isPhantom The phantom state (true for new (= phantom))
     */
    public setPhantom(isPhantom: boolean) {
        this._isPhantom = isPhantom;
    }

    public isDestroyed(): boolean {
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
    public async load(queryParams?: QueryParams | null): Promise<this> {
        const res = await this.getDataProxy().fetch(this, { ...this.queryParams, ...queryParams });
        if (res) {
            this.set(res);
        }
        this.commit();

        this._isPhantom = false;
        this._isDestroyed = false;
        return this;
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
    public async save(queryParams?: QueryParams | null): Promise<this> {
        let res: PropertiesObject | null;
        if (this.isPhantom()) {
            res = await this.getDataProxy().create(this, { ...this.queryParams, ...queryParams });
        } else {
            res = await this.getDataProxy().update(this, { ...this.queryParams, ...queryParams });
        }
        if (res) {
            this.set(res);
        }
        this.commit();
        this._isPhantom = false;
        this._isDestroyed = false;
        return this;
    }

    public async destroy(queryParams?: QueryParams | null): Promise<this> {
        if (!this.isPhantom()) {
            const res = await this.getDataProxy().delete(this, { ...this.queryParams, ...queryParams });
            if (res) {
                this.set(res);
                this.commit();
            }
            this._isPhantom = true;
            this._isDestroyed = true;
        }

        return this;
    }

    public getDirtyProps(): PropertiesObject {
        const dirty = { ...this._dirtyProps };
        Object.keys(dirty).forEach((key) => {
            dirty[key] = this.get(key);
        });
        return dirty;
    }

    public getProps(): PropertiesObject {
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

    public toJSON() {
        return this.getProps();
    }

    /**
     * Sets a permanent query param: Permanent query params are added to all query() calls.
     *
     * @param key The param name, e.g. 'filter'
     * @param value The query param value, e.g. 'id=3'
     * @returns this
     */
    public setQueryParam(key: string, value: any): this {
        this._queryParams[key] = value;
        return this;
    }

    /**
     * Sets multiple permanent query params: Permanent query params are added to all query() calls.
     *
     * @param params Multiple query params as object, e.q. {filter: 'id=1', order: 'name'}
     * @returns this
     */
    public setQueryParams(params: QueryParams): this {
        this._queryParams = { ...this._queryParams, ...params };
        return this;
    }

    /**
     * Removes a permanent query param: Permanent query params are added to all query() calls.
     *
     * @param key The query param name to be removed from the set of permanent queries
     * @returns this
     */
    public removeQueryParam(key: string): this {
        delete this._queryParams[key];
        return this;
    }

    /**
     * The set of permanent query params. Permanent query params are added to all query() calls.
     */
    public get queryParams(): QueryParams {
        return { ...this._queryParams };
    }
}
