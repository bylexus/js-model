export type MutationsFn = (value: any) => any;
export type PropertiesObject = { [key: string]: any };
export type MutationsObject = { [key: string]: MutationsFn };

const internalModelProps = ['_props', '_dirtyProps'];

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
        // apply mutation, if available:
        const mut = target.mutations();
        if (Object.keys(mut).includes(prop) && typeof mut[prop] === 'function') {
            const mutFn = mut[prop];
            newValue = mutFn.apply(receiver, [newValue]);
        }
        target[prop] = newValue;
        return true;
    },
};

export default abstract class Model {
    private _dirtyProps: PropertiesObject;

    public constructor() {
        this._dirtyProps = {};

        // set up and return the proxy object:
        const proxyThis = new Proxy(this, proxyHandler as ProxyHandler<this>);
        proxyThis.commit();
        return proxyThis;
    }

    public set(data: PropertiesObject): this {
        Object.assign(this, data);
        return this;
    }

    public get(key: string): any {
        for (const [k, val] of Object.entries(this)) {
            if (k === key ) {
                return val;
            }
        }
        return undefined
    }

    // protected abstract members(): PropertiesObject;
    protected mutations(): MutationsObject {
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

    public rollback() {
        Object.assign(this, this._dirtyProps);
        this._dirtyProps = {};
    }
}
