import { Collection, Model } from '../src/';

class EmptyModel extends Model {}

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
    });

    test('default values apply mutations', () => {
        const i = new TestModel();
        expect(i.upName).toStrictEqual('LEER');
        expect(i.boolVal).toStrictEqual(false);
        expect(i.alwaysPlusOne).toStrictEqual(1);
    });

    describe('set', () => {
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
});
