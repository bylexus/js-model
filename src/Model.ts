import DataProxy, { DummyDataProxy } from './DataProxy';
import { PropertiesObject, MutationsObject, QueryParams } from './SharedTypes';

const internalModelProps = ['_dirtyProps', '_rollbackMode', '_isPhantom', '_isDestroyed'];

/**
 * The Proxy Handler intercepts behaviour of the model:
 * it sets up "trap" functions to intercept interactions:
 *
 * get: Property access to the model
 * set: When setting a property, we check if it is defined, apply mutations,
 *      and store the original value for dirty checking / rolling back.
 */
const proxyHandler = {
    get(target: PropertiesObject, prop: string, receiver: any): any {
        // if a function is called / requested, return it with a bind to the proxy:
        if (typeof target[prop] === 'function') {
            return target[prop].bind(receiver);
        }

        // else return a property:
        if (Object.keys(target).includes(prop)) {
            return target[prop];
        } else {
            return undefined;
        }
    },

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
    /** set to true during rollback: this allows the proxy to skip certain modifications */
    private _rollbackMode = false;

    /** if true, it is still an in-memory-only record: it was not saved yet. */
    private _isPhantom = true;

    /** if true, this model instance was deleted using destroy(). */
    private _isDestroyed = false;

    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    public getDataProxy(): DataProxy {
        return new DummyDataProxy();
    }

    public constructor() {
        this._dirtyProps = {};

        // set up and return the proxy object:
        const proxyThis = new Proxy(this, proxyHandler as ProxyHandler<this>);
        proxyThis.commit();
        return proxyThis;
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
        await this.getDataProxy().fetch(this, queryParams);
        this._isPhantom = false;
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
        if (this.isPhantom()) {
            await this.getDataProxy().create(this, queryParams);
        } else {
            await this.getDataProxy().update(this, queryParams);
        }
        this.commit();
        this._isPhantom = false;
        this._isDestroyed = false;
        return this;
    }

    public async destroy(queryParams?: QueryParams | null): Promise<this> {
        if (!this.isPhantom()) {
            await this.getDataProxy().delete(this, queryParams);
            this._isPhantom = true;
            this._isDestroyed = true;
        }

        return this;
    }
}
