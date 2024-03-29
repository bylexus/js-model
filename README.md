# js-model

An approach to create a dependency-free, slim, backend-agnostic, type-safe and simple-to-use JS Model/Collection library to be used
with (but not only) reactive frameworks.

- [What is js-model?](#what-is-js-model)
- [Main goals of the library](#main-goals-of-the-library)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [User Documentation](#user-documentation)
  - [Installation](#installation)
  - [A first model](#a-first-model)
  - [A first collection](#a-first-collection)
  - [Implement a storage mechanism using DataProxy](#implement-a-storage-mechanism-using-dataproxy)
    - [The DataProxy interface](#the-dataproxy-interface)
    - [Example DataProxy](#example-dataproxy)
  - [VueJS integration](#vuejs-integration)
- [Developer Documentation](#developer-documentation)
  - [Dev setup](#dev-setup)
  - [Build](#build)
  - [Publish npm package](#publish-npm-package)
- [Whishlist](#whishlist)


## What is js-model?

js-model allows the definition of "Models" and collections of Models: A Model is a "blueprint" defining the shape of your business objects,
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

## Prerequisites

## User Documentation

TBD. You will need to use a modern JS/TS environment, suporting ES Modules, or a packager like webpack, rollup etc.

### Installation

This library is available as npm package, but not from the official npmjs.com registry: I use github.com as package registry,
as this package should not become part of the global npmjs ecosystem (for now).

So in order to install this library, you need to define github as the registry for my namespace:

In your `.npmrc` file (either in your user home or in your project directory), configure the npm registry:

```plain
# .npmrc:
@bylexus:registry=https://npm.pkg.github.com
```

Now you can install it as any other npm package using `npm`:

```sh
$ npm install @bylexus/js-model.git
```

### A first model

Defining a model is very simple:

```ts
// MyModel.ts:

import {Model} from 'js-model';

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
```

This defines a model class with an id, a name, a phone number, a calculated value `upperCaseName` and a mysterious property called "alwaysPlusOne".
The `mutations()` method allows you to define special setter mutators: simple functions that get the value of a property,
and mutate the value before storing them internally. In this example, phone gets cleaned of whitespace,
while "alwaysPlusOne" is incremented by 1 if set.

Now you're ready to use your model:

```ts
import {createModel} from 'js-model';

const myModel = createModel(TestModel, {name: 'Fritz'});
// set some properties, override defined properties):
myModel.set({
    id: 42,
    name: 'Alex',
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
    alwaysPlusOne: 21,
    upperCaseName: 'ALEX'
}
```

### A first collection

Most of the time you want to operate not only with single models, but with a list / collection of models. This is what the `Collection` class
is for: It organizes models of the same type in one collection.

```ts
// MyCollection.ts

import {Collection, createModel} from 'js-model';
import MyModel from './MyModel';

class MyCollection extends Collection<MyModel> {
    // Defines the constructor function / Class of the used Model class:
    public modelCls = MyModel;
}

const myCol = new MyCollection();
myCol.push(createModel(MyModel,{name: 'Alex'}));
myCol.push(createModel(MyModel,{name: 'Blex'}));
myCol.push(createModel(MyModel,{name: 'Clex'}));

myCol.getModels().forEach(m => console.log(m.name));

console.log(myCol.length()); // 3
let first = myCol.first(); // Alex
let one = myCol.at(1); // BLex
let rm = myCol.remove(one); // or: .remove(1)

// ... and more to come!
```

### Implement a storage mechanism using DataProxy

Most of the time you want to load / store / query your models from some kind of backend, e.g. via a REST api.
Because this is highly project- and framework specific, `js-model` does NOT implement this storage backend: Instead,
it offers you the needed interfaces to allow you to implement it by yourself.

There are several method in the `Model` and `Collection` classes that perform some kind of data load/store operation:

* `Model.load()` loads the content of an entity
* `Model.save()` saves the entity to a backend
* `Model.destroy()` deletes the entity to a backend
* `Collection.query()` fetches models from a backend using a specific query

To allow those operations to work, you need to implement the `getDataProxy()` method: This method must return
an object implementing the `DataProxy` interface. It is up to you to implement the needed methods, so you are free (and burden with)
to use whatever storage mechanism you want.

#### The DataProxy interface

The needed interface that `getDataProxy()` needs to return is defined as follows:

```ts
interface DataProxy {
    // Fetch data for a single model:
    fetch<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;
    // initial-store a new model:
    create<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;
    // store an exiting model:
    update<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;
    // delete an exiting model:
    delete<T extends Model>(model: T, queryParams?: QueryParams | null): Promise<PropertiesObject | null>;

    // query for models:
    query<M extends Model, C extends Collection<M>>(
        collection: C,
        queryParams?: QueryParams | null,
    ): Promise<PropertiesObject[]>;
}
```

This looks complicated, but it's not :-) We will create an example DataProxy right below:

#### Example DataProxy

We will implement a dummy DataProxy object: You _can_ share a single data proxy instance for all your models / collections,
to save memory, but you _don't have to_: If you e.g. want to implement some kind of specific proxy per model, feel free to do so!

```ts
import { DataProxy } from 'js-model';
import type { PropertiesObject } from 'js-model';

class FakeDataProxy implements DataProxy {
    async fetch<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject|null> {
    const data = await api.get(`/${m.getClassName()}/${m.get('id')}`);
		return data;
    }
    async create<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject|null> {
		const data = await api.post(`/${m.getClassName()}`, m.getProps());
		return data;
    }
    async update<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject|null> {
		const data = await api.patch(`/${m.getClassName()}/${m.get('id')}`, m.getProps());
		return data;
    }
    async delete<M extends Model>(m: M, queryParams?: QueryParams): Promise<PropertiesObject|null> {
		const data = await api.destory(`/${m.getClassName()}/${m.get('id')}`);
		return data;
    }

    async query<M extends Model, C extends Collection<M>>(collection: C, queryParams?: QueryParams): Promise<PropertiesObject[]> {
		const data = await api.query(`/${collection.getModelClassName()}`, queryParams);
        return data;
    }
}
```

You can now return an instance of this class from your `Model` and `Collection`'s `getDataProxy()` methods:

```ts
import {Model, Collection, DataProxy} from 'js-model';

class MyModel extends Model {
	// ....

	public getDataProxy(): DataProxy() {
		return new FakeDataProxy();
	}
}

class MyCollection extends Collection {
	// ....

	public getDataProxy(): DataProxy() {
		return new FakeDataProxy();
	}
}
```

Now if you call data fetching / storing / query functions on your models / collections, your apropriate Proxy methods will be called,
where you are responsible to retrieve / send the data.

### VueJS integration

The Model class can be used without special arrangements in a reactive VueJS application. For example,
you can define your Model as a reactive variable and use it as reactive value:

```js
<script setup>
import {ref} from 'vue';
import {createModel} from 'js-model';

const myModel = ref(createModel(MyModel, {foo: 'bar'}));
</script>

<template>
  <div>{{myModel.foo}}</div>
  <div><input v-model="myModel.foo" /></div>
</template>
```

However, for Collections, VueJS can use the collection itself, but does not detect changes in it,
as the internal array reference does not change (only its content).

It is therefore neccessary to create a base Collection class that overcomes that problem:

```ts
class BaseCollection<T extends BaseModel> extends Collection<T> {
    public constructor() {
        super();
        // here we override the internal _models array with a
        // dynamic ref proxy version of VueJS:
        const refModels:Ref<T[]> = ref([]);
        this._models = refModels.value;
    }
}
```

With this setup, you can use your collections in a VueJS application:

```ts
<script setup lang="ts">
import {ref} from 'vue';

const myCollection = new BaseCollection<MyModel>();
</script>

<template>
  <div v-for="model in myCollection.getModels()" :key="model.id">{{model.name}}</div>
</template>
```

## Developer Documentation

### Dev setup

Clone and run the first build:

```sh
$ git clone https://github.com/bylexus/js-model.git
$ command -v nvm && nvm install && nvm use
$ npm run build
```

### Build

Building converts all `.ts` sources to `.js` files and type declarations (`.d.ts`).
The build goes to the `dist/` folder.

```sh
$ command -v nvm && nvm install && nvm use
$ npm run build
```

During development, you can also use the watch command:

```sh
$ npm run watch
```

### Publish npm package

The npm package is not hosted on npmjs.com, instead it is hosted on the github.com package registry.

To publish the package, you need a [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) with access to the repository.

Configure your Access Token in a `.npmrc` file, either:

* in your user home: `${HOME}/.npmrc`
* in the project directory itself: `js-model/.npmrc`

**MAKE SURE TO NEVER COMMIT THE FILE WITH THE TOKEN IN IT!**

```txt
# .npmrc:
//npm.pkg.github.com/:_authToken=YOUR_ACCESS_TOKEN
```

Then, set a version, commit/tag and publish:

```sh
$ npm version [new-version]
$ git add .
$ git commit -m "New version ABC"
$ git tag [new-version]
$ npm publish
```

## Whishlist

- Server Total value available after Collection query:
  A collection query fetching remote data should be able to return a server total,
  if not all records are fetched.


(c) 2023 Alexander Schenkel, alex-jsmodel@alexi.ch


