import DataProxy, { DummyDataProxy } from './DataProxy';
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

    constructor() {
        this._models = [];
    }

    public clear() {
        if (this._models.length > 0) {
            this._models.splice(0);
        }
    }

    public push(el: T | PropertiesObject | T[] | PropertiesObject[]): this {
        if (el instanceof Array) {
            el.forEach((item) => this.push(item));
            return this;
        } else if (el instanceof Model) {
            this._models.push(el);
            return this;
        } else {
            const m = new this.modelCls(el) as T;
            m.set(el);
            this._models.push(m);
            return this;
        }
    }

    public length() {
        return this._models.length;
    }

    public getModels(): T[] {
        return this._models;
    }

    public first(): T | null {
        if (this._models.length > 0) {
            return this._models[0];
        }
        return null;
    }

    public last(): T | null {
        if (this._models.length > 0) {
            return this._models[this._models.length - 1];
        }
        return null;
    }

    public at(index: number): T | null {
        if (index >= 0 && index < this.length()) {
            return this._models[index];
        }
        return null;
    }

    public remove(el: T | number) {
        const idx = typeof el === 'number' ? el : this._models.indexOf(el);
        if (idx >= 0) {
            this._models.splice(idx, 1);
        }
    }

    /**
     * Implement in child classes: Must return a DataProxy instance.
     * The default implementation just reurns a dummy data proxy that does nothing.
     */
    public getDataProxy(): DataProxy {
        return new DummyDataProxy();
    }

    /**
     * Query will ask the DataProxy
     * @param queryOpts
     * @param opts
     * @returns
     */
    public async query(queryParams?: QueryParams | null, opts?: QueryOptions | null): Promise<this> {
        const res = await this.getDataProxy().query(this, queryParams);

        if (opts?.append !== true) {
            this.clear();
        }

        res.forEach((item) => this.push(item));
        return this;
    }

    public find(predicate: PredicateFn<T>): T | null {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicate(models[index], index)) {
                return models[index];
            }
        }
        return null;
    }

    public each(fn: (model: T, index?: number) => void): void {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            fn(models[index], index);
        }
    }
    public arrayCopy(): T[] {
        return [...this.getModels()];
    }

    public map<R>(mapFn: (model: T, index?: number) => R): R[] {
        const res: R[] = [];
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            res.push(mapFn(models[index], index));
        }
        return res;
    }

    public filter(filterFn: PredicateFn<T>): T[] {
        const res: T[] = [];
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (filterFn(models[index], index)) {
                res.push(models[index]);
            }
        }
        return res;
    }

    public contains(predicate: T): boolean {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicate === models[index]) {
                return true;
            }
        }
        return false;
    }

    public containsBy(predicateFn: PredicateFn<T>): boolean {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicateFn(models[index], index)) {
                return true;
            }
        }
        return false;
    }

    public getDirtyModels(): T[] {
        const ret: T[] = [];
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
    public getModelClassName(): string {
        console.warn('default getModelClassName() method used: This is unreliable. Override it with your own implementation.')
        return this.modelCls.name;
    }
}
