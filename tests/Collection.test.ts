import { Collection, Model, DataProxy } from '../src';
import { QueryParams } from '../src/SharedTypes';

class TestCollection extends Collection<TestModel> {
    public modelCls = TestModel;
}

class TestModel extends Model {
    id: number | null = null;
    name: string | null = 'leer';
    upName: string | null = 'leer';
    boolVal: any = 0;
    alwaysPlusOne = 0;

    public mutations() {
        return {
            upName: (val: string | null) => (typeof val === 'string' ? val.toUpperCase() : null),
            boolVal: Boolean,
            alwaysPlusOne: (val: number) => val + 1,
        };
    }

    public getDataProxy(): DataProxy {
        return {
            fetch(m: TestModel): Promise<TestModel> {
                return new Promise<TestModel>((success, err) => {
                    // fake timeout and data
                    setTimeout(() => {
                        // fail case: if id is -1
                        if (m.id === -1) {
                            return err('fail!');
                        }
                        m.id = 42;
                        m.name = 'fetch-test';
                        m.upName = 'fetch-test';
                        success(m);
                    }, 2);
                });
            },
            async create(m: TestModel): Promise<TestModel> {
                return m;
            },
            async update(m: TestModel): Promise<TestModel> {
                return m;
            },
            async delete(m: TestModel): Promise<TestModel> {
                return m;
            },
            async query(collection: TestCollection): Promise<TestModel[]> {
                return [] as TestModel[];
            },
        } as DataProxy;
    }
}

describe('Collection', () => {
    test('can be inherited and instantiated', () => {
        const c = new TestCollection();
        expect(c).toBeInstanceOf(TestCollection);
        expect(c.modelCls).toEqual(TestModel);
    });

    describe('push()', () => {
        test('pushing single models', () => {
            const c = new TestCollection();
            const m1 = new TestModel();
            const m2 = new TestModel();
            c.push(m1);
            expect(c.length()).toEqual(1);
            c.push(m2);
            expect(c.length()).toEqual(2);
            expect(c.getModels()[0] === m1).toBeTruthy();
            expect(c.getModels()[1] === m2).toBeTruthy();
        });

        test('pushing single data objects', () => {
            const c = new TestCollection();
            const m1 = { name: 'Alex', upName: 'blex' };
            const m2 = { name: 'Clex', upName: 'dlex' };
            c.push(m1);
            expect(c.length()).toEqual(1);
            c.push(m2);
            expect(c.length()).toEqual(2);
            expect(c.getModels()[0].name).toEqual('Alex');
            expect(c.getModels()[0].upName).toEqual('BLEX');
            expect(c.getModels()[1].name).toEqual('Clex');
            expect(c.getModels()[1].upName).toEqual('DLEX');
        });

        test('pushing multiple models as array', () => {
            const c = new TestCollection();
            const m1 = new TestModel();
            const m2 = new TestModel();
            c.push([m1, m2]);
            expect(c.length()).toEqual(2);
            expect(c.getModels()[0] === m1).toBeTruthy();
            expect(c.getModels()[1] === m2).toBeTruthy();
        });

        test('pushing multiple data objects as array', () => {
            const c = new TestCollection();
            const m1 = { name: 'Alex', upName: 'blex' };
            const m2 = { name: 'Clex', upName: 'dlex' };
            c.push([m1, m2]);
            expect(c.length()).toEqual(2);
            expect(c.getModels()[0].name).toEqual('Alex');
            expect(c.getModels()[0].upName).toEqual('BLEX');
            expect(c.getModels()[1].name).toEqual('Clex');
            expect(c.getModels()[1].upName).toEqual('DLEX');
        });
    });

    test('first()', () => {
        const c = new TestCollection();
        const m1 = new TestModel();
        const m2 = new TestModel();
        c.push(m1);
        c.push(m2);
        expect(c.first() === m1).toBeTruthy();
    });
    test('last()', () => {
        const c = new TestCollection();
        const m1 = new TestModel();
        const m2 = new TestModel();
        const m3 = new TestModel();
        c.push(m1);
        c.push(m2);
        c.push(m3);
        expect(c.last() === m3).toBeTruthy();
    });

    test('at()', () => {
        const c = new TestCollection();
        const m1 = new TestModel();
        const m2 = new TestModel();
        const m3 = new TestModel();
        c.push(m1);
        c.push(m2);
        c.push(m3);
        expect(c.at(0) === m1).toBeTruthy();
        expect(c.at(1) === m2).toBeTruthy();
        expect(c.at(2) === m3).toBeTruthy();
        expect(c.at(-1)).toStrictEqual(null);
        expect(c.at(3)).toStrictEqual(null);
    });

    test('remove(model)', () => {
        const c = new TestCollection();
        const m1 = new TestModel();
        const m2 = new TestModel();
        const m3 = new TestModel();
        const m4 = new TestModel();
        c.push(m1);
        c.push(m2);
        c.push(m3);
        c.remove(m1);
        c.remove(m4);
        expect(c.length()).toEqual(2);
        expect(c.at(0) === m2).toBeTruthy();
        expect(c.at(1) === m3).toBeTruthy();
    });

    test('remove(index)', () => {
        const c = new TestCollection();
        const m1 = new TestModel();
        const m2 = new TestModel();
        const m3 = new TestModel();
        c.push(m1);
        c.push(m2);
        c.push(m3);
        c.remove(1);
        c.remove(4);
        expect(c.length()).toEqual(2);
        expect(c.at(0) === m1).toBeTruthy();
        expect(c.at(1) === m3).toBeTruthy();
    });

    describe('query()', () => {
        test('query() calls DataProxy::query with queryParams', async () => {
            const c = new TestCollection();
            const queryMock = jest.fn(async (c: TestCollection, q?: QueryParams) => {
                return [];
            });
            const queryParams = { foo: 'bar', enabled: true };
            c.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    query: queryMock,
                } as DataProxy;
            };

            const ret = await c.query(queryParams);
            expect(ret === c).toBeTruthy();
            expect(queryMock).toBeCalledTimes(1);
            expect(queryMock).toBeCalledWith(c, queryParams);
        });

        test('query() calls DataProxy::query with additional set queryParams', async () => {
            const c = new TestCollection();
            const queryMock = jest.fn(async (c: TestCollection, q?: QueryParams) => {
                return [];
            });
            const queryParams = { foo: 'bar', enabled: true };
            const addedQueryParams = { foo: 'baz', filter: { ids: [1, 2, 3] } };
            c.setQueryParams(addedQueryParams);

            c.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    query: queryMock,
                } as DataProxy;
            };

            const ret = await c.query(queryParams);
            expect(ret === c).toBeTruthy();
            expect(queryMock).toBeCalledTimes(1);
            expect(queryMock).toBeCalledWith(c, { ...addedQueryParams, ...queryParams });
        });

        test('query() will replace the collection content', async () => {
            const c = new TestCollection();
            const m1 = new TestModel();
            const m2 = new TestModel();
            const m3 = new TestModel();
            const m4 = new TestModel();
            const queryMock = jest.fn(async (c: TestCollection, q?: QueryParams) => {
                return [m3, m4];
            });
            c.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    query: queryMock,
                } as DataProxy;
            };
            c.push(m1);
            c.push(m2);

            await c.query();
            expect(queryMock).toBeCalledTimes(1);
            expect(c.length()).toEqual(2);
            expect(c.at(0) === m3).toBeTruthy();
            expect(c.at(1) === m4).toBeTruthy();
        });

        test('models loaded with query() are non-phantom', async () => {
            const c = new TestCollection();
            const m1 = new TestModel();
            const m2 = new TestModel();
            const queryMock = jest.fn(async (c: TestCollection, q?: QueryParams) => {
                return [m1, m2];
            });
            c.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    query: queryMock,
                } as DataProxy;
            };

            await c.query();
            expect(c.getModels()[0].isPhantom()).toBeFalsy();
            expect(c.getModels()[1].isPhantom()).toBeFalsy();
        });

        describe('QueryOptions', () => {
            test('query() will add the result if append option is given', async () => {
                const c = new TestCollection();
                const m1 = new TestModel();
                const m2 = new TestModel();
                const m3 = new TestModel();
                const m4 = new TestModel();
                const queryMock = jest.fn(async (c: TestCollection, q?: QueryParams) => {
                    return [m3, m4];
                });
                c.getDataProxy = () => {
                    // @ts-ignore: we don't define a proper type here.
                    return {
                        query: queryMock,
                    } as DataProxy;
                };
                c.push(m1);
                c.push(m2);

                await c.query(null, { append: true });
                expect(queryMock).toBeCalledTimes(1);
                expect(c.length()).toEqual(4);
                expect(c.at(0) === m1).toBeTruthy();
                expect(c.at(1) === m2).toBeTruthy();
                expect(c.at(2) === m3).toBeTruthy();
                expect(c.at(3) === m4).toBeTruthy();
            });

            test('setQueryParam() will add/replace to the set of permanent query params', () => {
                const col = new TestCollection();

                col.setQueryParam('filter', 'id=5');
                col.setQueryParam('filter2', true);
                col.setQueryParam('filter', 'id=1');
                expect(col.queryParams).toEqual({ filter: 'id=1', filter2: true });
            });
            test('setQueryParams() will add/replace to the set of permanent query params', () => {
                const col = new TestCollection();

                col.setQueryParam('filter', 'id=5');
                col.setQueryParam('filter2', true);

                col.setQueryParams({ filter: 'id=1', filter3: 'test3' });
                expect(col.queryParams).toEqual({ filter: 'id=1', filter2: true, filter3: 'test3' });
            });

            test('removeQueryParam() will remove the given query param', () => {
                const col = new TestCollection();

                col.setQueryParams({ filter: 'id=1', filter2: 'foo', filter3: 'test3' });
                col.removeQueryParam('filter2');
                expect(col.queryParams).toEqual({ filter: 'id=1', filter3: 'test3' });
            });
        });
    });

    describe('find()', () => {
        test('finds the FIRST entry by the specified predicte function', () => {
            const c = new TestCollection();
            const m1 = new TestModel().set('name', 'Alex');
            c.push(m1);
            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Clex'));
            c.push(m1);
            expect(m1 === c.find((m) => m.name === 'Alex'));
        });

        test('returns null if no model could be found', () => {
            const c = new TestCollection();
            const m1 = new TestModel().set('name', 'Alex');
            c.push(m1);
            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Clex'));
            c.push(m1);
            expect(c.find((m) => m.name === 'Dlex')).toBeNull();
        });
    });

    describe('each()', () => {
        test('loops through every model in the collection', () => {
            const c = new TestCollection();
            const seen: (string | null)[] = [];
            c.push(new TestModel().set('name', 'Alex'));
            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Clex'));
            c.each((item) => seen.push(item.name));
            expect(seen).toEqual(['Alex', 'Blex', 'Clex']);
        });
    });

    describe('map()', () => {
        test('converts each item to a new type, and returns an array of that type', () => {
            const c = new TestCollection();
            c.push(new TestModel().set('name', 'Alex'));
            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Clex'));
            const res = c.map((m, i) => ({ name: m.name, i: i }));
            expect(res).toEqual([
                { name: 'Alex', i: 0 },
                { name: 'Blex', i: 1 },
                { name: 'Clex', i: 2 },
            ]);
        });
    });

    describe('filter()', () => {
        test('returns only the elements matching the predicate function. Returns a new array.', () => {
            const col = new TestCollection();
            const a = new TestModel().set('name', 'Alex');
            const b = new TestModel().set('name', 'Blexx');
            const c = new TestModel().set('name', 'Clex');
            const d = new TestModel().set('name', 'Dlexx');
            col.push([a, b, c, d]);
            const res = col.filter((m) => !!m.name?.match(/xx/));
            expect(res).toBeInstanceOf(Array);
            expect(res !== col.getModels()).toBeTruthy();
            expect(res[0].name).toEqual('Blexx');
            expect(res[1].name).toEqual('Dlexx');
        });
    });

    describe('arrayCopy()', () => {
        test('will return all models in a new array', () => {
            const col = new TestCollection();
            const a = new TestModel().set('name', 'Alex');
            const b = new TestModel().set('name', 'Blexx');
            const c = new TestModel().set('name', 'Clex');
            const d = new TestModel().set('name', 'Dlexx');
            col.push([a, b, c, d]);
            const res = col.arrayCopy();

            expect(res).toBeInstanceOf(Array);
            expect(res).toHaveLength(4);
            expect(res !== col.getModels()).toBeTruthy();
            expect(res[0] === a).toBeTruthy();
            expect(res[1] === b).toBeTruthy();
            expect(res[2] === c).toBeTruthy();
            expect(res[3] === d).toBeTruthy();
        });
    });

    describe('contains(), containsBy()', () => {
        test('containsBy() returns true if the predicate function returns true', () => {
            const c = new TestCollection();

            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Alex'));
            c.push(new TestModel().set('name', 'Clex'));
            c.push(new TestModel().set('name', 'Alex'));

            expect(c.containsBy((m) => m.name === 'Alex')).toBeTruthy();
        });

        test('containsBy() returns false if no model could be found by predicate', () => {
            const c = new TestCollection();
            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Alex'));
            c.push(new TestModel().set('name', 'Clex'));
            c.push(new TestModel().set('name', 'Alex'));

            expect(c.containsBy((m) => m.name === 'Dlex')).toBeFalsy();
        });

        test('contains() returns true if a model could be found by reference (model pointer)', () => {
            const c = new TestCollection();
            const m = new TestModel().set('name', 'Clex');

            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Alex'));
            c.push(m);
            c.push(new TestModel().set('name', 'Alex'));

            expect(c.contains(m)).toBeTruthy();
        });

        test('contains() returns false if a model could not be found by reference (model pointer)', () => {
            const c = new TestCollection();
            const m = new TestModel().set('name', 'Clex');

            c.push(new TestModel().set('name', 'Blex'));
            c.push(new TestModel().set('name', 'Alex'));
            c.push(new TestModel().set('name', 'Alex'));

            expect(c.contains(m)).toBeFalsy();
        });
    });

    describe('getDirtyModels()', () => {
        test('returns models marked as dirty in this collection', () => {
            const col = new TestCollection();
            const a = new TestModel().set('name', 'Alex');
            const b = new TestModel().set('name', 'Blexx').commit();
            const c = new TestModel().set('name', 'Clex');
            const d = new TestModel().set('name', 'Dlexx').commit();
            col.push([a, b, c, d]);
            const res = col.getDirtyModels();

            expect(res).toBeInstanceOf(Array);
            expect(res).toHaveLength(2);
            expect(res !== col.getModels()).toBeTruthy();
            expect(res[0] === a).toBeTruthy();
            expect(res[1] === c).toBeTruthy();
        });
    });

    describe('getModelClassName()', () => {
        test('extract models class name from constructor name', () => {
            const col = new TestCollection();
            expect(col.getModelClassName()).toEqual('TestModel');
        });
    });
});
