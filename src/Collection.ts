import Model, { PropertiesObject } from './Model';

interface ModelConstructor {
    new (initialData?: PropertiesObject | null): Model;
}

export default abstract class Collection<T extends Model> {
    protected models: T[];
    protected abstract modelCls: ModelConstructor;

    constructor() {
        this.models = [];
    }

    public clear() {
        this.models = [];
    }

    public push(el: T | PropertiesObject): T {
        if (el instanceof this.modelCls) {
            this.models.push(el);
            return el;
        } else {
            const m = new this.modelCls(el) as T;
            this.models.push(m);
            return m;
        }
    }

    public getModels(): T[] {
        return this.models;
    }

    public first(): T | null {
        if (this.models.length > 0) {
            return this.models[0];
        }
        return null;
    }

    public last(): T | null {
        if (this.models.length > 0) {
            return this.models[this.models.length - 1];
        }
        return null;
    }
}
