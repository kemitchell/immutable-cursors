Immutable Cursors
=================

This CommonJS module provides cursors for Facebook's [ImmutableJS](https://facebook.github.io/immutable-js/) library. It is
essentially a standalone fork of the excellent
**[contrib/cursor](https://github.com/facebook/immutable-js/tree/master/contrib/cursor)** module that ships with every
distribution of ImmutableJS.

From their README:

> Cursors allow you to hold a reference to a path in a nested immutable data structure, allowing you to pass smaller sections of a larger nested collection to portions of your application while maintaining a central point aware of changes to the entire data structure: an onChange function which is called whenever a cursor or sub-cursor calls update.

> This is particularly useful when used in conjuction with component-based UI libraries like [React](http://facebook.github.io/react/) or to simulate "state" throughout an application while maintaining a single flow of logic.

This pretty much sums it up.


This module is for most parts a **contrib/cursor** port to ES2015 including some minor additions and refactorings in order to provide a more extension-friendly and concise interface.

The CommonJS ES5/ES3 distribution is built with [Babel](babeljs.io).

## Getting started

The cursors implement the complete API of [`KeyedSeq`](https://facebook.github.io/immutable-js/docs/#/KeyedSeq) and [`IndexedSeq`](https://facebook.github.io/immutable-js/docs/#/IndexedSeq) respectively, so if you're familiar with ImmutableJS you should have no problems jumping right in. If not, you should probably have a glance at [their guides](https://facebook.github.io/immutable-js/) first.



### Install

The package is available on npm.

```
npm install immutable-cursors
```

### Basic operations

Import and provide some fixtures first:
```javascript
import Immutable from 'immutable';
import Cursor from 'immutable-cursors';

let data = Immutable.fromJS({
	name: {
		first: 'Luke',
		last: 'Skywalker'
	},
	age: 35
});
```


Retrieve an initial cursor like this:
```javascript
let cursor = Cursor.from(data);
cursor.getIn(['name', 'last']);
// 'Skywalker'
```

Retrieve nested initial state:

```javascript
let cursor = Cursor.from(data, ['name']);
cursor.get('last')
// 'Skywalker'
```

Access the ImmutableJS value that is backing the cursor directly:

```javascript
let cursor = Cursor.from(data, ['name']);
data.get('name') === cursor.deref();
// true
```

Cursors are immutable as well:
```javascript
let modifiedAgeCursor = cursor.set('age', 45);

cursor.get('age');
// 35
modifiedAgeCursor.get('age');
// 45
```

Cursors support value equality (see [Immutable.is](https://facebook.github.io/immutable-js/docs/#/is)). This is especially helpful in situations where you want to compare current to new nested state or props in React components, most prominently in `shouldComponentUpdate`:
```javascript
let valueEqualCursor = Cursor.from(data);

cursor === valueEqualCursor;
// false
Immutable.is(cursor, valueEqualCursor);
// true
Immutable.is(valueEqualCursor, data);
// true
```
Retrieve a sub-cursor:
```javascript
let nameCursor = cursor.cursor(['name']);

nameCursor.get('first');
// 'Luke'
```

Methods `get` and `getIn` also return sub-cursors if they don't point at a primitive value:
```javascript
let nameCursor = cursor.get('name');

nameCursor.get('last');
// 'Skywalker'
```

Cursors and their sub-cursors share a common root state and a change handler that gets called, whenever modifications on the cursor tree occur.

Handle state change:
```javascript
let cursor = Cursor.from(data, [], (nextState, currentState) {
	let newFirstName = nextState.getIn(['name', 'first']);
	let currentFirstName = currentState.getIn(['name', 'first']);
	console.log(currentFirstName + ' => ' + newFirstName);
});

cursor.setIn(['name', 'first'], 'Anakin');
// Luke => Anakin
```

You can intercept the state propagation by returning a state to perform validation, rollbacks etc.:
```javascript
let cursor = Cursor.from(data, ['name'], (nextState, currentState) {
	if (nextState.get('first') === 'Leia') {
		return nextState.set('last', 'Organa');
	}
});

let anakinCursor = cursor.set('first', 'Anakin');
anakinCursor.get('first');
// 'Anakin'

let leiaCursor = cursor.set('first', 'Leia');
leiaCursor.get('last');
// 'Organa'
```

## Docs

### API

#### Cursor.from(*state [, keyPath, changeHandler ]*)

Returns a new cursor.

###### Arguments

* `state`: An ImmutableJS object
* `keyPath`: A key path to the nested state the cursor should point to.
* `changeHandler`: Called whenever the state was modified. Receives the following arguments:
	* `nextState`: The next state.
	* `currentState`: The current state.
	* `keyPath`: An Immutable.Seq pointing at the nested state where the change occurred.

### Cursor methods

Cursors implement all of the methods of [`KeyedSeq`](https://facebook.github.io/immutable-js/docs/#/KeyedSeq) and
[`IndexedSeq`](https://facebook.github.io/immutable-js/docs/#/IndexedSeq). In addition to these, they ship with the following methods:

#### cursor(*keyPath*)

Returns a sub-cursor.

###### Arguments

* `keyPath`: A key path to the nested state the cursor should point to.

#### deref()

Returns the ImmutableJS object that is backing the cursor. Alias: `valueOf`



## Simplistic React example

Note that in a production environment you hardly want to modify cursors in your components directly. We do that here for the sake of simplicy.

```javascript
import React from 'react';
import Immutable from 'immutable';
import Cursor from 'immutable-cursors';

let data = Immutable.fromJS({
	name: {
		first: 'Luke',
		last: 'Skywalker'
	},
	age: 35
});
let app;

class Input extends React.Component {

	shouldComponentUpdate(nextProps) {
		// This is as easy as it gets
		let shouldChange = !this.props.cursor.equals(nextProps.cursor);

		console.log('\tShould ' + this.props.name + 'update?', shouldChange)
		return shouldChange;
	}

	onChange(event) {
		this.props.cursor.set(this.props.key, event.target.value);
	}

	render() {
		return (
			<label>{this.props.name}</label>
			<input type='text' onChange={this.onChange.bind(this)} />
		)
	}
}

class Application extends React.Component {

	render() {
		console.log('\n Render root component.');
		return (
			<div>
				<Input name='First name' cursor={this.props.cursor('name')} key='first' />
				<Input name='Last name' cursor={this.props.cursor('name')} key='last' />
				<Input name='Age' cursor={this.props.cursor} key='age' />
			</div>
		);
	}
}

function changeHandler(nextState) {
	app.setProps(Cursor.from(nextState, changeHandler));
}

app = React.render(
	<Application cursor={Cursor.from(nextState, changeHandler)} />,
	document.body
);
```

## Development

Get the source:
```
git clone https://github.com/lukasbuenger/immutable-cursors
```

Install dependencies:
```
npm install
```

Lint the code:
```
npm run lint
```

Run the tests:
```
npm test
```

Build ES5/ES3:
```
npm run build
```

Update all local dependencies:
```
npm run update-dependencies
```

## Roadmap

- [ ] Port Record properties support. ([Commit](https://github.com/facebook/immutable-js/commit/3389a756616c132fbff7476359ebf9ea7f1d0ff6))
- [ ] Improve docs. Complete API docs and extension guide
- [ ] Better test coverage

## License

See [LICENSE](LICENSE) file.