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
export default abstract class Collection<T extends Model> {
    protected _models: T[];
    protected abstract modelCls: ModelConstructor;
    constructor();
    clear(): void;
    push(el: T | PropertiesObject | T[] | PropertiesObject[]): this;
    length(): number;
    getModels(): T[];
    first(): T | null;
    last(): T | null;
    at(index: number): T | null;
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
    find(predicate: PredicateFn<T>): T | null;
    each(fn: (model: T, index?: number) => void): void;
    arrayCopy(): T[];
    map<R>(mapFn: (model: T, index?: number) => R): R[];
    filter(filterFn: PredicateFn<T>): T[];
    contains(predicate: T): boolean;
    containsBy(predicateFn: PredicateFn<T>): boolean;
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