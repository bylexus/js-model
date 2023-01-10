import { Model, Collection } from './index';

class TestModel extends Model {
    public name = 'leer';
}

const m = new TestModel();
console.log(m.name);
m.set('name', 'alex');
console.log(m.name);
