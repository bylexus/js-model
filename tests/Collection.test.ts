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

    test('pushing models', () => {
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
        });
    });
});
