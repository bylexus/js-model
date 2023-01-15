# js-model

An approach to create a dependency-free, slim, backend-agnostic, type-safe and simple-to-use JS Model/Collection library to be used
with (but not only) reactive frameworks.

## What is js-model?

js-model allows the definition of "Models" and collction of Models: A Model is a "blueprint" defining the shape of your business objects,
for example, a Person model with name, address and other properties. js-model gives you a solid base to define and work with Model classes,
and to organize them in collections ("fancy lists", arrays).

It allows you to:

* define Model classes with properties and methods
* define data mutators (functions that modify properties when set/updated)
* organize them in Collections, which by itself can be defined as Classes
* load/store/query them from a data backend
* use these entities in your application instead of plain JavaScript objects
* use these entities in a Reactive Framework like VueJS (may be ReactJS; I don't know yet), to create
  framework/model bindings

## Main goals of the library

* **Dependency-free:**<br>
  The library does NOT depend on other libraries, especially NOT on a certain data fetching library like axios, or a reactive framework like VueJS.
  It allows you to use the library with whathever framework you want to use it with.
* **Data store agnostic:**<br>
  js-model does NOT define loading / storing / updating / deleting code for you: It allows you to use your own data fetching/storing mechanism.
  It is up to you to implement your own backend communication, using e.g. [ axios http ](https://axios-http.com/).
  This is a bit more work for you, but does not bind you to any other framework.
* **Non-intrusive:**<br>
  js-model is more a library than a framework. Its main goal is to _stay out of your way_. It does not forces you to do it "the framework way".
* **Type safe:**<br>
  js-model uses TypeScript all the way down, which gives you type safety for your models and collections.

## Features

TBD

### Whishes

* getter functions: `get foo()`, to support calculated values


## First Steps

### Prerequisites

TBD. You will need to use a modern JS environment, suporting ES Modules, or a packager like webpack, rollup etc.

### Installation

TBD: as soon as this library is available as npm package, this section shows you how to install.
In the meantime, you can use it from the git repository directly:

```sh
$ npm install git+https://github.com/bylexus/js-model.git
```

### A first model

Defining a model is very simple:

```ts
class TestModel extends Model {
    id: number | null = null;
    name: string | null = '';
	phone: string | null = '';
    alwaysPlusOne = 0;

    public mutations() {
        return {
            phone: (val: string | null) => (typeof val === 'string' ? val.replace(/\s+/g, '') : null),
            alwaysPlusOne: (val: number) => val + 1,
        };
    }
}
```

This defines a model class with an id, a name, a phone number, and a mysterious property called "alwaysPlusOne".
The `mutations()` method allows you to define special setter mutators: simple functions that get the value of a property,
and mutate the value before storing them internally. In this example, phone gets cleaned of whitespace,
while "alwaysPlusOne" is incremented by 1 if set.

Not you're ready to use your model:

```ts
const myModel = new TestModel();
// set some properties:
myModel.set({
	id: 42,
	name 'Alex',
	phone: '+41 79 111 22 33',
	alwaysPlusOne: 20
});

// or set single values:
myModel.phone = '+41 79 111 22 33';
```

This represents an instance of your model with the following values:
```js
{
	id: 42,
	name 'Alex',
	phone: '+41791112233',
	alwaysPlusOne: 21
}
```

### A first collection

### Implement a storage mechanism using DataProxy

... more to come. This is just a draft.



(c) 2023 Alexander Schenke, alex-jsmodel@alexi.ch

