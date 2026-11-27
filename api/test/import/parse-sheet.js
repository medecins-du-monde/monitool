import assert from 'assert';
import parseSheet, {readCellValue} from '../../lib/import/parse-sheet';

const partition = (name, ...items) => ({id: name, name, elements: items.map(item => ({id: item, name: item}))});
const variable = (name, distribution, ...partitions) => ({id: 'id-' + name, name, distribution, partitions});
const sheet = (...elements) => ({elements});
const keys = result => result.errors.map(error => error.key);

describe('Multi-site import: parseSheet', () => {
  it('reads an unpartitioned variable', () => {
    const result = parseSheet(sheet(variable('A', 0)), [['A'], [], [5]]);
    assert.deepStrictEqual(result, {values: {'id-A': [5]}, errors: []});
  });

  it('reads blank unpartitioned variables, first and last, without taking the next title', () => {
    const ds = sheet(variable('A', 0), variable('B', 0), variable('C', 0));
    const result = parseSheet(ds, [['A'], [], [], [], [], ['B'], [], [7], [], [], ['C']]);
    assert.deepStrictEqual(result, {values: {'id-A': [null], 'id-B': [7], 'id-C': [null]}, errors: []});
  });

  it('reads rows only, ignoring the total row', () => {
    const ds = sheet(variable('A', 1, partition('age', '<5', '5+')));
    const result = parseSheet(ds, [['A'], [], ['<5', 1], ['5+', 2], ['Total', 3]]);
    assert.deepStrictEqual(result, {values: {'id-A': [1, 2]}, errors: []});
  });

  it('reads columns only, with no cached total and a blank value row', () => {
    const ds = sheet(variable('A', 0, partition('sex', 'M', 'F')), variable('B', 0));
    const result = parseSheet(ds, [['A'], [], ['M', 'F', 'Total'], [], [], [], ['B'], [], [3]]);
    assert.deepStrictEqual(result, {values: {'id-A': [null, null], 'id-B': [3]}, errors: []});
  });

  it('reads values row by row, last partition fastest, with 2 partitions per axis', () => {
    const ds = sheet(variable('A', 2, partition('r1', 'a', 'b'), partition('r2', 'c', 'd'), partition('c1', 'e', 'f'), partition('c2', 'g', 'h')));
    const rows = [['A'], [],
      ['', '', 'e', '', 'f', '', 'Total'],
      ['', '', 'g', 'h', 'g', 'h', 'Total'],
      ['a', 'c', 0, 1, 2, 3],
      ['', 'd', 4, 5, 6, 7],
      ['b', 'c', 8, 9, 10, 11],
      ['', 'd', 12, 13, 14, 15],
      ['Total', 'Total']];
    const result = parseSheet(ds, rows);
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.values['id-A'], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('keeps variables with the same name apart', () => {
    const ds = {elements: [{id: 'x', name: 'A', distribution: 0, partitions: []}, {id: 'y', name: 'A', distribution: 0, partitions: []}]};
    const result = parseSheet(ds, [['A'], [], [1], [], [], ['A'], [], [2]]);
    assert.deepStrictEqual(result.values, {x: [1], y: [2]});
  });

  it('is not fooled by a row label equal to a variable name', () => {
    const ds = sheet(variable('A', 1, partition('p', 'B', 'c')), variable('B', 0));
    const result = parseSheet(ds, [['A'], [], ['B', 1], ['c', 2], ['Total', 3], [], [], ['B'], [], [9]]);
    assert.deepStrictEqual(result, {values: {'id-A': [1, 2], 'id-B': [9]}, errors: []});
  });

  it('rejects reordered labels, which would otherwise map values to the wrong cells', () => {
    const ds = sheet(variable('A', 1, partition('age', '<5', '5+')));
    const result = parseSheet(ds, [['A'], [], ['5+', 1], ['<5', 2], ['Total', 3]]);
    assert.deepStrictEqual(keys(result), ['import.error.bad-header']);
    assert.deepStrictEqual(result.errors[0].extra.row, 3);
    assert.deepStrictEqual(result.values, {});
  });

  it('accepts holes and empty strings under a spanning label, and a renamed total', () => {
    const ds = sheet(variable('A', 0, partition('c1', 'e', 'f'), partition('c2', 'g', 'h')));
    const result = parseSheet(ds, [['A'], [], ['e', null, 'f', '', 'Somme'], ['g', 'h', 'g', 'h', ''], [1, 2, 3, 4]]);
    assert.deepStrictEqual(result, {values: {'id-A': [1, 2, 3, 4]}, errors: []});
  });

  it('reports a missing table, without noise on the following one', () => {
    const ds = sheet(variable('A', 0), variable('B', 0));
    assert.deepStrictEqual(keys(parseSheet(ds, [['B'], [], [1]])), ['import.error.no-table']);
    assert.deepStrictEqual(keys(parseSheet(ds, [['X'], [], [1], [], ['B'], [], [1]])), ['import.error.no-table']);
  });

  it('rejects content outside tables, and extra columns', () => {
    const ds = sheet(variable('A', 0), variable('B', 0));
    assert.deepStrictEqual(keys(parseSheet(ds, [['A'], [], [1], ['note'], ['B'], [], [1]])), ['import.error.content-outside-table']);
    assert.deepStrictEqual(keys(parseSheet(ds, [['A'], [], [1], [], ['B'], [], [1], ['note']])), ['import.error.content-outside-table']);
    assert.deepStrictEqual(keys(parseSheet(ds, [['A'], [], [1, 2], [], ['B'], [], [1]])), ['import.error.bad-number-of-cols']);
    assert.deepStrictEqual(keys(parseSheet(ds, [['A'], ['x'], [1], [], ['B'], [], [1]])), ['import.error.bad-table']);
  });

  it('reports each invalid value with its absolute position', () => {
    const ds = sheet(variable('A', 0), variable('B', 0, partition('p', 'a', 'b')));
    const result = parseSheet(ds, [['A'], [], [1], [], [], ['B'], [], ['a', 'b', 'Total'], [1.5, -2, 3]]);
    assert.deepStrictEqual(keys(result), ['import.error.not-whole-number', 'import.error.not-whole-number']);
    assert.deepStrictEqual(result.errors.map(e => [e.extra.row, e.extra.col, e.extra.value]), [[9, 'A', '1.5'], [9, 'B', '-2']]);
  });

  it('accepts whole numbers only', () => {
    [0, 5, '12', ' 12 ', 2147483647].forEach(cell => assert.strictEqual(readCellValue(cell), Number(cell)));
    [null, undefined, '', '  '].forEach(cell => assert.strictEqual(readCellValue(cell), null));
    [1.5, -1, -123456, 1e-7, 1e21, 2147483648, true, false, '1.5', '-1', '1,5', '1e3', '0x10', 'abc', '#REF!', {}, NaN, Infinity]
      .forEach(cell => assert.strictEqual(readCellValue(cell), undefined, String(cell)));
  });
});
