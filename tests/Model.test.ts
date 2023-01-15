import { Collection, Model, DataProxy } from '../src/';
import { QueryParams } from '../src/SharedTypes';

class TestCollection extends Collection<TestModel> {
    public modelCls = TestModel;
}

class EmptyModel extends Model {
    public getDataProxy(): DataProxy {
        return {} as DataProxy;
    }
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

describe('Model', () => {
    test('can be inherited and instantiated', () => {
        const i = new TestModel();
        expect(i).toBeInstanceOf(TestModel);
        expect(i).toBeInstanceOf(Model);
    });

    test('has default values', () => {
        const i = new TestModel();
        expect(i.id).toBeNull();
        expect(i.name).toEqual('leer');
        expect(i.get('unknown')).toBeUndefined();
        expect(i.isPhantom()).toBeTruthy();
    });

    test('default values apply mutations', () => {
        const i = new TestModel();
        expect(i.upName).toStrictEqual('LEER');
        expect(i.boolVal).toStrictEqual(false);
        expect(i.alwaysPlusOne).toStrictEqual(1);
    });

    describe('set', () => {
        test('returns self', () => {
            const i = new TestModel();
            const ret = i.set({});
            expect(ret === i).toBeTruthy();
        });

        test('sets values on the object, including mutations', () => {
            const i = new TestModel();
            i.set({
                name: 'alex',
                upName: 'blex',
                alwaysPlusOne: 5,
                unknown: 'foo',
            });
            expect(i.id).toBeNull();
            expect(i.name).toEqual('alex');
            expect(i.upName).toEqual('BLEX');
            expect(i.alwaysPlusOne).toEqual(6);
            expect(i.get('unknown')).toEqual('foo');
        });

        test('set takes a single key and value', () => {
            const i = new TestModel();
            i.set('name', 'singleKey');
            i.set('upName', 'upSingleKey');
            expect(i.name).toEqual('singleKey');
            expect(i.upName).toEqual('UPSINGLEKEY');
        });
    });

    describe('dirty', () => {
        test('is clean on init when model has no props', () => {
            const i = new EmptyModel();
            expect(i.isDirty()).toStrictEqual(false);
        });
        test('is dirty on init when model has props', () => {
            const i = new TestModel();
            expect(i.isDirty()).toStrictEqual(true);
        });
        test('is dirty after property set', () => {
            const i = new TestModel();
            i.name = 'Alex';
            expect(i.isDirty()).toStrictEqual(true);
        });
    });

    describe('commit', () => {
        test('returns self', () => {
            const i = new TestModel();
            const ret = i.commit();
            expect(ret === i).toBeTruthy();
        });

        test('commits the actual properties', () => {
            const i = new TestModel().set({
                name: 'one',
            });
            expect(i.name).toEqual('one');
            expect(i.isDirty()).toBeTruthy();

            i.commit();
            expect(i.name).toEqual('one');
            expect(i.isDirty()).toBeFalsy();
        });

        test('commits and sets delivered properties', () => {
            const i = new TestModel().commit({
                name: 'one',
            });
            expect(i.name).toEqual('one');
            expect(i.isDirty()).toBeFalsy();
        });
    });

    describe('rollback', () => {
        test('returns self', () => {
            const i = new TestModel();
            const ret = i.rollback();
            expect(ret === i).toBeTruthy();
        });

        test('rolls back to the last committed values', () => {
            const i = new TestModel().set({
                name: 'one',
                upName: 'hello',
                boolVal: true,
                alwaysPlusOne: 8,
            });
            i.commit();
            expect(i.alwaysPlusOne).toStrictEqual(9);

            i.set({
                upName: 'ciao',
                boolVal: false,
                alwaysPlusOne: 4,
            });
            i.rollback();

            expect(i.name).toEqual('one');
            expect(i.upName).toEqual('HELLO');
            expect(i.boolVal).toStrictEqual(true);
            expect(i.alwaysPlusOne).toStrictEqual(9);
            expect(i.isDirty()).toBeFalsy();
        });
    });

    describe('mutations', () => {
        test('mutation is called when value is set', () => {
            const i = new TestModel().commit({ name: 'alex', upName: 'upper', alwaysPlusOne: 1 });
            expect(i.upName).toEqual('UPPER');
            expect(i.alwaysPlusOne).toEqual(2);

            i.upName = 'lower';
            expect(i.upName).toEqual('LOWER');

            i.alwaysPlusOne = 10;
            expect(i.alwaysPlusOne).toEqual(11);
        });
    });

    describe('phantom', () => {
        test('new record is a phantom record', () => {
            const i = new TestModel();
            expect(i.isPhantom()).toBeTruthy();
        });

        test('new record stays phantom after modifying/committing', () => {
            const i = new TestModel().commit({ name: 'Achmed' });

            expect(i.isPhantom()).toBeTruthy();
        });
    });

    describe('load', () => {
        test('load will call the DataProxy::fetch function', async () => {
            const i = new TestModel();
            await i
                .set({
                    id: 5,
                    name: 'foo',
                    upName: 'foo',
                })
                .load();
            expect(i.id).toStrictEqual(42);
            expect(i.name).toStrictEqual('fetch-test');
            expect(i.upName).toStrictEqual('FETCH-TEST');
        });

        test('load sends queryParams to DataProxy::fetch', async () => {
            const i = new TestModel();
            const fetchMock = jest.fn(async (m: TestModel, p?: QueryParams) => {
                return m;
            });
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    fetch: fetchMock,
                } as DataProxy;
            };
            await i
                .set({
                    id: 5,
                    name: 'foo',
                    upName: 'foo',
                })
                .load({
                    p1: 'foo',
                    p2: true,
                });
            expect(fetchMock).toBeCalledTimes(1);
            expect(fetchMock).toBeCalledWith(i, {
                p1: 'foo',
                p2: true,
            });
        });

        test('load makes a record non-phantom', async () => {
            const i = new TestModel();
            expect(i.isPhantom()).toBeTruthy();
            await i
                .set({
                    id: 5,
                })
                .load();
            expect(i.isPhantom()).toBeFalsy();
        });

        test('load will throw an exception on error', async () => {
            const i = new TestModel();
            try {
                await i
                    .set({
                        id: -1,
                    })
                    .load();
            } catch (e) {
                expect(e).toMatch('fail!');
            }
        });
    });

    describe('save', () => {
        test('save will call DataProxy::create for a new instance', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const updateMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                    update: updateMock,
                } as DataProxy;
            };
            i.set({ id: 5, name: 'foo' });

            const ret = await i.save();
            expect(ret === i).toBeTruthy();
            expect(createMock.mock.calls).toHaveLength(1);
            expect(updateMock.mock.calls).toHaveLength(0);
        });

        test('save will update isPhantom and isDirty', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                } as DataProxy;
            };
            i.set({ id: 5, name: 'foo' });
            expect(i.isPhantom()).toBeTruthy();

            await i.save();
            expect(i.isDirty()).toBeFalsy();
            expect(i.isPhantom()).toBeFalsy();
        });

        test('save will send queryParams to DataProxy::create, update', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const updateMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const queryParams = { foo: 'bar', enable: true };
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                    update: updateMock,
                } as DataProxy;
            };
            i.set({ id: 5, name: 'foo' });
            await i.save(queryParams);
            expect(updateMock).toBeCalledTimes(0);
            expect(createMock).toBeCalledTimes(1);
            expect(createMock).toBeCalledWith(i, queryParams);
            i.set({ name: 'moo' });
            await i.save(queryParams);
            expect(updateMock).toBeCalledTimes(1);
            expect(createMock).toBeCalledTimes(1);
            expect(updateMock).toBeCalledWith(i, queryParams);
        });
    });

    describe('destroy', () => {
        test('destroy will call DataProxy::delete to delete an instance', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const deleteMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                    delete: deleteMock,
                } as DataProxy;
            };
            await i.set({ id: 5, name: 'foo' }).save();

            const ret = await i.destroy();

            expect(ret === i).toBeTruthy();
            expect(deleteMock.mock.calls).toHaveLength(1);
            expect(i.isPhantom()).toBeTruthy();
            expect(i.isDestroyed()).toBeTruthy();
        });

        test('destroy will NOT call DataProxy::delete if it is a phantom record', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const deleteMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                    delete: deleteMock,
                } as DataProxy;
            };

            const ret = await i.destroy();

            expect(ret === i).toBeTruthy();
            expect(deleteMock.mock.calls).toHaveLength(0);
            expect(i.isPhantom()).toBeTruthy();
            expect(i.isDestroyed()).toBeFalsy();
        });
        test('save after destroy will re-save it', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const deleteMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                    delete: deleteMock,
                } as DataProxy;
            };
            await i.save();
            const ret = await i.destroy();
            await i.save();

            expect(ret === i).toBeTruthy();
            expect(deleteMock.mock.calls).toHaveLength(1);
            expect(createMock.mock.calls).toHaveLength(2);
            expect(i.isPhantom()).toBeFalsy();
            expect(i.isDestroyed()).toBeFalsy();
        });
        test('destroy will send queryParams to DataProxy::delete', async () => {
            const i = new TestModel();
            const createMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const deleteMock = jest.fn(async (m: TestModel) => {
                return m;
            });
            const queryParams = { foo: 'bar', enabled: true };
            i.getDataProxy = () => {
                // @ts-ignore: we don't define a proper type here.
                return {
                    create: createMock,
                    delete: deleteMock,
                } as DataProxy;
            };
            await i.set({ id: 5, name: 'foo' }).save();
            await i.destroy(queryParams);

            expect(deleteMock).toBeCalledTimes(1);
            expect(deleteMock).toBeCalledWith(i, queryParams);
        });
    });
});
