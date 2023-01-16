import { Model } from '../src';

class TestModel extends Model {
    // define your properties:
    id: number | null = null;
    name: string | null = '';
    phone: string | null = '';
    alwaysPlusOne = 0;

    // define calculated values as standard JS getters:
    public get upperCaseName() {
        return (this.name || '').toUpperCase();
    }

    public mutations() {
        return {
            phone: (val: string | null) => (typeof val === 'string' ? val.replace(/\s+/g, '') : null),
            alwaysPlusOne: (val: number) => val + 1,
        };
    }
}

const myModel = new TestModel();
// set some properties:
myModel.set({
    id: 42,
    name: 'Alex',
    phone: '+41 79 111 22 33',
    alwaysPlusOne: 20,
});

// or set single values:
myModel.phone = '+41 79 111 22 33';

console.log(myModel);