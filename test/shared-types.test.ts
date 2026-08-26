import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {fromSpriteUri, toSpriteUri} from '../src/shared/types.ts';

void test('sprite URI conversion keeps supported non-PNG extensions', () => {
  assert.equal(
    toSpriteUri('/game/gfx/sprite/character/idle/frame.webp'),
    'sprite:character/idle/frame.webp'
  );
  assert.equal(
    fromSpriteUri('sprite:character/idle/frame.webp'),
    './gfx/sprite/character/idle/frame.webp'
  );
});

void test('sprite URI conversion retains the legacy PNG form', () => {
  assert.equal(
    toSpriteUri('/game/gfx/sprite/character/idle/frame.png'),
    'sprite:character/idle/frame'
  );
  assert.equal(
    fromSpriteUri('sprite:character/idle/frame'),
    './gfx/sprite/character/idle/frame.png'
  );
});

void test('sprite URI conversion accepts browser workspace paths', () => {
  assert.equal(
    toSpriteUri('./gfx/sprite/strawberry/still/bottom/bb.png'),
    'sprite:strawberry/still/bottom/bb'
  );
});
