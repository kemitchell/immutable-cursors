import { Iterable, Map, Record } from 'immutable';
import IndexedCursor from './IndexedCursor';
import KeyedCursor from './KeyedCursor';
import pathToSeq from './pathToSeq';

const NOT_SET = {};

export default class API {

	cursorFrom(rootData, keyPath, onChange) {
		keyPath = this.path(keyPath);
		return this.makeCursor(rootData, keyPath, onChange);
	}

	getCursorClass(value) {
		return Iterable.isIndexed(value) ? IndexedCursor : KeyedCursor;
	}

	makeCursor(rootData, keyPath, onChange, value, CursorClass, sharedOptions) {
		keyPath = this.path(keyPath);
		if (!value) {
			value = rootData.getIn(keyPath);
		}
		let size = value && value.size;
		CursorClass = CursorClass || this.getCursorClass(value);
		let cursor = new CursorClass(rootData, keyPath, onChange, size, this, sharedOptions);

		if (value instanceof Record) {
			this.defineRecordProperties(cursor, value);
		}

		return cursor;
	}

	updateCursor(cursor, changeFn, changeKeyPath) {
		let deepChange = arguments.length > 2;
		let newRootData = cursor._rootData.updateIn(
			cursor._keyPath,
			deepChange ? new Map() : undefined,
			changeFn
		);
		let keyPath = cursor._keyPath;
		let result = cursor._onChange && cursor._onChange.call(
			undefined,
			newRootData,
			cursor._rootData,
			deepChange ? this.path(keyPath, changeKeyPath) : keyPath
		);
		if (result !== undefined) {
			newRootData = result;
		}
		return this.makeCursor(newRootData, cursor._keyPath, cursor._onChange, undefined, cursor.constructor, cursor._sharedOptions);
	}

	get NOT_SET() {
		return NOT_SET;
	}

	wrappedValue(cursor, keyPath, value) {
		return Iterable.isIterable(value) ? this.subCursor(cursor, keyPath, value) : value;
	}

	subCursor(cursor, keyPath, value) {
		return this.makeCursor(
			cursor._rootData,
			pathToSeq(cursor._keyPath, keyPath),
			cursor._onChange,
			value,
			undefined,
			undefined
		);
	}

	defineRecordProperties(cursor, value) {
		value._keys.forEach(this.setProp.bind(undefined, cursor));
	}

	setProp(prototype, name) {
		Object.defineProperty(prototype, name, {
			get: function() {
				return this.get(name);
			},
			set: function() {
				if (!this.__ownerID) {
					throw new Error('Cannot set on an immutable record.');
				}
			}
		});
	}

	path(...paths) {
		return pathToSeq(...paths);
	}

	export() {
		return {
			from: this.cursorFrom.bind(this)
		};
	}
}
