import DataProxy from './DataProxy';
import Model from './Model';
import { PropertiesObject, QueryParams } from './SharedTypes';
interface QueryOptions {
    append?: boolean;
}
interface ModelConstructor {
    new (initialData?: PropertiesObject | null): Model;
}
type PredicateFn<T> = (m: T, index?: number) => boolean;
/**
 * The Collection class represents a collection / list of the same
 * models. It offers methods to organize the model instances and
 * work with them (e.g. looping over all), as well as query them from
 * a configured DataProxy.
 *
 * You NEED to define the modelCls property: modelCls defines the
 * Model class / constructor function of the internal models.
 *
 * Example:
 *
 * <code>
 * class PersonCollection extends Collection<Person> {
 *     protected abstract modelCls: Person
 * }
 * </code>
 *
 * If you want to load / query models through a DataProxy,
 * you have to implement the getDataProxy() method:
 *
 * <code>
 * class PersonCollection extends Collection<Person> {
 *     protected abstract modelCls: Person
 *     public getDataProxy(): DataProxy {
 *         return getYourDataProxy();
 *     }
 * }
 * </code>
 *
 * It's up to you to provide / implement a DataProxy object / class.
 */
export default abstract class Collection<T extends Model> {
    protected _models: T[];
    protected _queryParams: QueryParams;
    protected abstract modelCls: ModelConstructor;
    constructor();
    clear(): void;
    /**
     * Adds a / some Model isntance(s) to the collection.
     *
     * You can pass either a Model instance, properties object,
     * or an array of each.
     * If you pass a data object, new Model instance(s) of this.modelCls are instantiated
     * and filled with the data.
     *
     * Example:
     * <code>
     * const p = new Person();
     * const o = {name: 'Alex', surname: 'Schenkel'};
     * const col = new PersonCollection();
     *
     * // single Model, single object:
     * col.push(p).push(o);
     *
     * multiple models:
     * col.push([new Person(), new Person()])
     *
     * // multiple data objects:
     * col.push([{name: 'Alex', surname: 'Schenkel'}, {name: 'Blex'}])
     * </code>
     *
     * @param el The models(s) / data object(s) to add
     * @returns this
     */
    push(el: T | PropertiesObject | T[] | PropertiesObject[]): this;
    /**
     * Returns the number of models in this collection
     */
    length(): number;
    /**
     * Returns an array of the internal Models.
     * Note that subsequence calls will always return the same array instance:
     * The internal array is not re-assigned ever.
     */
    getModels(): T[];
    /**
     * Returns a copy of the internal models array
     */
    arrayCopy(): T[];
    /**
     * Returns the first model in the collection, or null if there is no first one
     */
    first(): T | null;
    /**
     * Returns the last model in the collection, or null if there is no last one
     */
    last(): T | null;
    /**
     * Returns the model at the given index (0-indexed), or null if
     * this index does not exist.
     */
    at(index: number): T | null;
    /**
     * Removes the given model instance / the model at the given index.
     * @param el Either a model instance or the index of the model to be removed.
     *           In the case of an instance, object references are compared.
     */
    remove(el: T | number): void;
    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    getDataProxy(): DataProxy;
    /**
     * Query will ask the DataProxy
     * @param queryOpts
     * @param opts
     * @returns
     */
    query(queryParams?: QueryParams | null, opts?: QueryOptions | null): Promise<this>;
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
    /**
     * Finds a (the first) model instance that satisfies the predicate function.
     * The given predicate function must return true(ish) to indicate a match.
     *
     * Example:
     * <code>
     * const m = collection.find((model, index) => model.name === 'Alex');
     * </code>
     *
     * @param predicate The predicate function (model, index) => boolean
     * @returns The found model instance, or null if there is no match
     */
    find(predicate: PredicateFn<T>): T | null;
    /**
     * Similar to the Array.forEach function, this method loops
     * over all Models and applies the given function.
     *
     * Example:
     * <code>
     * collection.each((model, index) => model.name = model.name?.trim());
     * </code>
     * @param fn The function to apply to each model instance: (model, index) => void
     */
    each(fn: (model: T, index?: number) => void): void;
    /**
     * Similar to the Array.map function, this method loops
     * over all Models and transforms the element.
     * A new array with the transformed elements is returned.
     *
     * Example:
     * <code>
     * const lengths = collection.map((model, index) => model.name?.length);
     * </code>
     * @param mapFn The function to transform each model instance: (model, index) => any
     */
    map<R>(mapFn: (model: T, index?: number) => R): R[];
    /**
     * Similar to the Array.filter function, this method returns a new
     * array with all Models matching the filter predicate.
     *
     * Example:
     * <code>
     * const longerThan5 = collection.filter((model, index) => model.name?.length > 5);
     * </code>
     * @param filterFn The filter predicate function: (model, index) => boolean
     */
    filter(filterFn: PredicateFn<T>): T[];
    /**
     * Checks if a given Model is part of this collection. The object references
     * must match, not the contents.
     *
     * @param predicate The predicate function (model, index) => boolean
     * @returns The found model instance, or null if there is no match
     */
    contains(predicate: T): boolean;
    /**
     * Checks if a (the first) model matches the given predicate function.
     * Unlike the find method, this method just returns true/false.
     *
     * The given predicate function must return true(ish) to indicate a match.
     *
     * Example:
     * <code>
     * if (collection.contains((model, index) => model.name === 'Alex')) {
     *     console.log('Yes, Alex is here');
     * };
     * </code>
     *
     * @param predicate The predicate function (model, index) => boolean
     * @returns The found model instance, or null if there is no match
     */
    containsBy(predicateFn: PredicateFn<T>): boolean;
    /**
     * Returns an array of all dirty (not committed) models.
     */
    getDirtyModels(): T[];
    /**
     * Returns the class name of the Collection's model class
     *
     * Note that you *SHOULD* override this method in child classes if you need
     * it for e.g. backend entity naming.
     *
     * *WARNING*: The default class name function is NOT reliable: it depends on
     * the constructor function's name, which can change if the code is minified!
     * So you should ALWAYS override this method!
     *
     * @returns
     */
    getModelClassName(): string;
}
export {};
//# sourceMappingURL=Collection.d.ts.map