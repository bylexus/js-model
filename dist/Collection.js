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
import Model from './Model';
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
export default class Collection {
    constructor() {
        this._queryParams = {};
        this._models = [];
    }
    clear() {
        if (this._models.length > 0) {
            this._models.splice(0);
        }
    }
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
    push(el) {
        if (el instanceof Array) {
            el.forEach((item) => this.push(item));
            return this;
        }
        else if (el instanceof Model) {
            this._models.push(el);
            return this;
        }
        else {
            const m = new this.modelCls(el);
            m.set(el);
            this._models.push(m);
            return this;
        }
    }
    /**
     * Returns the number of models in this collection
     */
    length() {
        return this._models.length;
    }
    /**
     * Returns an array of the internal Models.
     * Note that subsequence calls will always return the same array instance:
     * The internal array is not re-assigned ever.
     */
    getModels() {
        return this._models;
    }
    /**
     * Returns a copy of the internal models array
     */
    arrayCopy() {
        return [...this.getModels()];
    }
    /**
     * Returns the first model in the collection, or null if there is no first one
     */
    first() {
        if (this._models.length > 0) {
            return this._models[0];
        }
        return null;
    }
    /**
     * Returns the last model in the collection, or null if there is no last one
     */
    last() {
        if (this._models.length > 0) {
            return this._models[this._models.length - 1];
        }
        return null;
    }
    /**
     * Returns the model at the given index (0-indexed), or null if
     * this index does not exist.
     */
    at(index) {
        if (index >= 0 && index < this.length()) {
            return this._models[index];
        }
        return null;
    }
    /**
     * Removes the given model instance / the model at the given index.
     * @param el Either a model instance or the index of the model to be removed.
     *           In the case of an instance, object references are compared.
     */
    remove(el) {
        const idx = typeof el === 'number' ? el : this._models.indexOf(el);
        if (idx >= 0) {
            this._models.splice(idx, 1);
        }
    }
    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    getDataProxy() {
        return new DummyDataProxy();
    }
    /**
     * Query will ask the DataProxy
     * @param queryOpts
     * @param opts
     * @returns
     */
    query(queryParams, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.getDataProxy().query(this, Object.assign(Object.assign({}, this.queryParams), queryParams));
            if ((opts === null || opts === void 0 ? void 0 : opts.append) !== true) {
                this.clear();
            }
            res.forEach((item) => {
                var _a;
                this.push(item);
                (_a = this.last()) === null || _a === void 0 ? void 0 : _a.setPhantom(false);
            });
            return this;
        });
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
    find(predicate) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicate(models[index], index)) {
                return models[index];
            }
        }
        return null;
    }
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
    each(fn) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            fn(models[index], index);
        }
    }
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
    map(mapFn) {
        const res = [];
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            res.push(mapFn(models[index], index));
        }
        return res;
    }
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
    filter(filterFn) {
        const res = [];
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (filterFn(models[index], index)) {
                res.push(models[index]);
            }
        }
        return res;
    }
    /**
     * Checks if a given Model is part of this collection. The object references
     * must match, not the contents.
     *
     * @param predicate The predicate function (model, index) => boolean
     * @returns The found model instance, or null if there is no match
     */
    contains(predicate) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicate === models[index]) {
                return true;
            }
        }
        return false;
    }
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
    containsBy(predicateFn) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicateFn(models[index], index)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Returns an array of all dirty (not committed) models.
     */
    getDirtyModels() {
        const ret = [];
        this.each((item) => {
            if (item.isDirty()) {
                ret.push(item);
            }
        });
        return ret;
    }
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
    getModelClassName() {
        console.warn('default getModelClassName() method used: This is unreliable. Override it with your own implementation.');
        return this.modelCls.name;
    }
}
//# sourceMappingURL=Collection.js.map