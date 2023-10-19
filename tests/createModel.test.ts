import { Model, createModel } from '../src';

import { PropertiesObject } from '../src/SharedTypes';

class TestModel extends Model {
    id: number | null = null;
    name: string | null = 'leer';
    upName: string | null = 'leer';
    boolVal = false;
    alwaysPlusOne = 0;
}

describe('createModel', () => {
    test('returns a pre-configured Model instance without props', () => {
        const m = createModel(TestModel);
        expect(m).toBeInstanceOf(TestModel);
        expect(m.name).toEqual('leer');
    });

    test('returns a pre-configured Model instance with props', () => {
        const m = createModel(TestModel, {
            name: 'Achmed',
            boolVal: true,
        } as PropertiesObject);
        expect(m).toBeInstanceOf(TestModel);
        expect(m.name).toEqual('Achmed');
        expect(m.upName).toEqual('leer');
        expect(m.boolVal).toEqual(true);
    });
});
