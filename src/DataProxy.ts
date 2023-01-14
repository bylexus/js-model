import Collection from './Collection';
import Model from './Model';

export default interface DataProxy {
    /**
     * Fetches the data of the given single model from a backend,
     * and fills the instance's properties.
     *
     * @param model The model to fill. The given model is modified, no new one is instantiated
     * @return A promise with the model instance (same instance),
     *  resolving after the load/fill is finished
     */
    fetch<T extends Model>(model: T): Promise<T>;
    create<T extends Model>(model: T): Promise<T>;
    update<T extends Model>(model: T): Promise<T>;
    delete<T extends Model>(model: T): Promise<T>;

    query<M extends Model, C extends Collection<M>>(collection: C): Promise<C>;
}
