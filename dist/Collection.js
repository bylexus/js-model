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
export default class Collection {
    constructor() {
        this._models = [];
    }
    clear() {
        if (this._models.length > 0) {
            this._models.splice(0);
        }
    }
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
    length() {
        return this._models.length;
    }
    getModels() {
        return this._models;
    }
    first() {
        if (this._models.length > 0) {
            return this._models[0];
        }
        return null;
    }
    last() {
        if (this._models.length > 0) {
            return this._models[this._models.length - 1];
        }
        return null;
    }
    at(index) {
        if (index >= 0 && index < this.length()) {
            return this._models[index];
        }
        return null;
    }
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
            const res = yield this.getDataProxy().query(this, queryParams);
            if ((opts === null || opts === void 0 ? void 0 : opts.append) !== true) {
                this.clear();
            }
            res.forEach((item) => this.push(item));
            return this;
        });
    }
    find(predicate) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicate(models[index], index)) {
                return models[index];
            }
        }
        return null;
    }
    each(fn) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            fn(models[index], index);
        }
    }
    arrayCopy() {
        return [...this.getModels()];
    }
    map(mapFn) {
        const res = [];
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            res.push(mapFn(models[index], index));
        }
        return res;
    }
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
    contains(predicate) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicate === models[index]) {
                return true;
            }
        }
        return false;
    }
    containsBy(predicateFn) {
        const models = this.getModels();
        for (let index = 0; index < models.length; index++) {
            if (predicateFn(models[index], index)) {
                return true;
            }
        }
        return false;
    }
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