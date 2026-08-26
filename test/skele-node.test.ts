import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {SkeleNode} from '../src/utils/SkeleNode.ts';

void test('node lookup reflects tree mutations', () => {
  const root = SkeleNode.fromData({
    angle: 0,
    mag: 1,
    id: 'root',
    children: [{angle: 0, mag: 1, id: 'child'}],
  });
  const child = root.findId('child');

  assert.ok(child);
  assert.equal(root.findId('missing'), null);
  child?.remove();
  assert.equal(root.findId('child'), null);
});

void test('sprite hit testing uses rendered scale', () => {
  const root = SkeleNode.fromData({
    angle: 0,
    mag: 1,
    children: [{angle: 0, mag: 0.25, uri: 'sprite:test'}],
  });
  root.tickMove(0, 0, 1, 0);
  const sprite = root.children[0];

  assert.equal(sprite.hitTest(0.4, 0, 0.01), 0.4);
});
