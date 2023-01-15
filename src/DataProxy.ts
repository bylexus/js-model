import Collection from './Collection';
import Model from './Model';
import { QueryParams } from './SharedTypes';

export default interface DataProxy {
    /**
     * Fetches the data of the given single model from a backend,
     * and fills the instance's properties.
     *
     * @param model The model to fill. The given model is modified, no new one is instantiated
     * @return A promise with the model instance (same instance),
     *  resolving after the load/fill is finished
     */
    fetch<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<T>;
    create<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<T>;
    update<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<T>;
    delete<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<T>;

    query<M extends Model, C extends Collection<M>>(collection: C, queryParams?: QueryParams | null): Promise<M[]>;
}

export class DummyDataProxy implements DataProxy {
    async fetch<M extends Model>(m: M, queryParams?: QueryParams): Promise<M> {
        return m;
    }
    async create<M extends Model>(m: M, queryParams?: QueryParams): Promise<M> {
        return m;
    }
    async update<M extends Model>(m: M, queryParams?: QueryParams): Promise<M> {
        return m;
    }
    async delete<M extends Model>(m: M, queryParams?: QueryParams): Promise<M> {
        return m;
    }

    async query<M extends Model, C extends Collection<M>>(collection: C, queryParams?: QueryParams): Promise<M[]> {
        const res: M[] = [];
        return res;
    }
}
