import Model from './Model';

export class MyModel extends Model {
    public id: number | null = 0;
    public name: string | null = '';

    constructor(props: object) {
        super();
    }
}
