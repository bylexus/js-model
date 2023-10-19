import DataProxy from './DataProxy';
import { MutationsObject, PropertiesObject, QueryParams } from './SharedTypes';
export type ModelConstructor<T extends Model> = new (...args: any[]) => T;
export default abstract class Model {
    private _dirtyProps;
    protected _queryParams: QueryParams;
    /** set to true during rollback: this allows the proxy to skip certain modifications */
    private _rollbackMode;
    /** if true, it is still an in-memory-only record: it was not saved yet. */
    private _isPhantom;
    /** if true, this model instance was deleted using destroy(). */
    private _isDestroyed;
    private _className;
    /**
     * Contains all properties of this model that are
     * commited (after calling commit()).
     */
    $: PropertiesObject;
    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    getDataProxy(): DataProxy;
    constructor();
    /**
     * Returns the class name of this model
     * Note that you *SHOULD* override this method in child classes if you need
     * it for e.g. backend entity naming.
     *
     * *WARNING*: The default class name function is NOT reliable: it depends on
     * the constructor function's name, which can change if the code is minified!
     * So you should ALWAYS override this method!
     */
    getClassName(): string;
    set(keyOrData: string | PropertiesObject, data?: any): this;
    get(key: string): any;
    mutations(): MutationsObject;
    isDirty(): boolean;
    commit(data?: PropertiesObject): this;
    rollback(): this;
    /**
     * Phantom means the record only exists in memory, so was neither load or stored from/to a backend.
     *
     * @returns true if this is a new, unsaved record, false if it was loaded or saved to/from a backend
     */
    isPhantom(): boolean;
    /**
     * Seths the phantom state of this model. Use with caution:
     * normally this is handled by the framework, so only use if you know what you are doing!
     *
     * @param isPhantom The phantom state (true for new (= phantom))
     */
    setPhantom(isPhantom: boolean): void;
    isDestroyed(): boolean;
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
    load(queryParams?: QueryParams | null): Promise<this>;
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
    save(queryParams?: QueryParams | null): Promise<this>;
    destroy(queryParams?: QueryParams | null): Promise<this>;
    getDirtyProps(): PropertiesObject;
    getProps(): PropertiesObject;
    toJSON(): PropertiesObject;
    /**
     * Sets a permanent query param: Permanent query params are added to all query() calls.
     *
     * @param key The param name, e.g. 'filter'
     * @param value The query param value, e.g. 'id=3'
     * @returns this
     */
    setQueryParam(key: string, value: any): this;
    /**
     * Sets multiple permanent query params: Permanent query params are added to all query() calls.
     *
     * @param params Multiple query params as object, e.q. {filter: 'id=1', order: 'name'}
     * @returns this
     */
    setQueryParams(params: QueryParams): this;
    /**
     * Removes a permanent query param: Permanent query params are added to all query() calls.
     *
     * @param key The query param name to be removed from the set of permanent queries
     * @returns this
     */
    removeQueryParam(key: string): this;
    /**
     * The set of permanent query params. Permanent query params are added to all query() calls.
     */
    get queryParams(): QueryParams;
    protected updateCommitedProps(): void;
}
/**
 * Creates a new instance of a specific Model, optionally
 * defining properties of the new model instance.
 *
 * @param constr The Model instance class (constructor) function
 * @param props (optional) An object with instance properties
 * @returns The created and filled Model instance
 */
export declare function createModel<M extends Model>(constr: ModelConstructor<M>, props?: PropertiesObject): M;
//# sourceMappingURL=Model.d.ts.map