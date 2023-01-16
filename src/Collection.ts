import DataProxy, { DummyDataProxy } from './DataProxy';
import Model from './Model';
import { PropertiesObject, QueryParams } from './SharedTypes';

interface QueryOptions {
    append?: boolean;
}

interface ModelConstructor {
    new (initialData?: PropertiesObject | null): Model;
}

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

    public push(el: T | PropertiesObject): T {
        if (el instanceof this.modelCls) {
            this._models.push(el);
            return el;
        } else {
            const m = new this.modelCls(el) as T;
            this._models.push(m);
            return m;
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

    public find(): T | null {
        // TODO: Implement!
        return null;
    }
    public each() {
        // TODO: Implement!
    }
    public arrayCopy() {
        // TODO: Implement!
    }
    public map() {
        // TODO: Implement!
    }
    public filter(): T[] {
        // TODO: Implement!
        return [] as T[];
    }
    public contains(): boolean {
        // TODO: Implement!
        return false;
    }

    public getDirtyProps(): PropertiesObject {
        // TODO: Implement!
        return {};
    }

    public getModelClassName(): string {

    }
}
