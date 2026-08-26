import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import type {VectorDrawing} from '../src/shared/types.ts';
import {
  convertCommand,
  createDefaultDrawing,
  duplicateDrawing,
} from '../src/utils/drawingEditor.ts';
import {serializeFabData} from '../src/utils/fabData.ts';
import {SkeleNode} from '../src/utils/SkeleNode.ts';

void test('new drawings use available points and a unique ID', () => {
  const existing: VectorDrawing[] = [
    {id: 'drawing', commands: [{type: 'move', point: 'a'}]},
  ];
  const drawing = createDefaultDrawing(existing, ['a', 'b', 'c']);

  assert.equal(drawing.id, 'drawing_2');
  assert.deepEqual(drawing.commands, [
    {type: 'move', point: 'a'},
    {type: 'line', point: 'b'},
    {type: 'line', point: 'c'},
    {type: 'close'},
  ]);
});

void test('duplicating a drawing creates an independent command list', () => {
  const source: VectorDrawing = {
    id: 'shape',
    commands: [{type: 'move', point: 'a'}],
  };
  const copy = duplicateDrawing(source, [source]);

  assert.equal(copy.id, 'shape_copy');
  assert.notEqual(copy.commands, source.commands);
  assert.notEqual(copy.commands[0], source.commands[0]);
});

void test('command conversion retains useful point references', () => {
  assert.deepEqual(
    convertCommand(
      {type: 'quadratic', control: 'handle', point: 'end'},
      'cubic',
      'fallback'
    ),
    {
      type: 'cubic',
      control1: 'handle',
      control2: 'fallback',
      point: 'end',
    }
  );
  assert.deepEqual(
    convertCommand({type: 'line', point: 'end'}, 'close', 'fallback'),
    {type: 'close'}
  );
});

void test('editable drawings are serialized instead of the loaded snapshot', () => {
  const drawings: VectorDrawing[] = [
    {
      id: 'edited-shape',
      fill: '#123456',
      commands: [{type: 'move', point: 'point'}],
    },
  ];
  const skele = SkeleNode.fromData({
    angle: 45,
    mag: 2,
    children: [{angle: 0, mag: 1, id: 'point'}],
  });

  const serialized = serializeFabData({
    name: 'Edited',
    description: 'From the drawings UI',
    drawings,
    skele,
  });

  assert.equal(serialized.drawings, drawings);
  assert.equal(serialized.skele.angle, 0);
  assert.equal(serialized.skele.mag, 1);
});
