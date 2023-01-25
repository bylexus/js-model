import Collection from './Collection';
import Model from './Model';
import { PropertiesObject, QueryParams } from './SharedTypes';

export default interface DataProxy {
    /**
     * Fetches the data of the given single model from a backend,
     * and fills the instance's properties.
     *
     * @param model The model to fill. The given model is modified, no new one is instantiated
     * @return A promise with a data object containing the fetched data. It is filled to the model after returning,
     *  resolving after the load/fill is finished
     */
    fetch<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;
    create<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;
    update<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;
    delete<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;

    query<M extends Model, C extends Collection<M>>(
        collection: C,
        queryParams?: QueryParams | null,
    ): Promise<PropertiesObject[]>;
}

export class DummyDataProxy implements DataProxy {
    async fetch<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject | null> {
        return null;
    }
    async create<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject | null> {
        return null;
    }
    async update<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject | null> {
        return null;
    }
    async delete<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject | null> {
        return null;
    }

    async query<M extends Model, C extends Collection<M>>(
        collection: C,
        queryParams?: QueryParams,
    ): Promise<PropertiesObject[]> {
        const res: M[] = [];
        return res;
    }
}
