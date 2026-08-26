import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import type {VectorDrawing} from '../src/shared/types.ts';
import {SkeleNode} from '../src/utils/SkeleNode.ts';
import {buildVectorPath} from '../src/utils/vectorDrawing.ts';

const createSkele = () => {
  const skele = SkeleNode.fromData({
    id: 'root',
    angle: 0,
    mag: 1,
    children: [
      {id: 'start', angle: 0, mag: 1},
      {id: 'control', angle: 90, mag: 1},
      {id: 'end', angle: 180, mag: 1},
    ],
  });
  skele.tickMove(0, 0, 1, 0);
  skele.updateState(1);
  return skele;
};

void test('vector paths use current skeletal point positions', () => {
  const drawing: VectorDrawing = {
    commands: [
      {type: 'move', point: 'start'},
      {type: 'quadratic', control: 'control', point: 'end'},
      {type: 'close'},
    ],
  };

  assert.equal(
    buildVectorPath(drawing, createSkele()),
    'M 2 0 Q 1.2246468525851679e-16 2 -2 2.4492937051703357e-16 Z'
  );
});

void test('vector paths fail as a unit when a point is missing', () => {
  const drawing: VectorDrawing = {
    commands: [
      {type: 'move', point: 'start'},
      {type: 'line', point: 'missing'},
    ],
  };

  assert.equal(buildVectorPath(drawing, createSkele()), null);
});
