import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {validate} from '../src/validation/fabSchema.ts';

void test('FAB validation rejects malformed image properties and non-finite transforms', () => {
  const result = validate({
    skele: {
      angle: Number.POSITIVE_INFINITY,
      mag: 1,
      props: 'not-an-object',
    },
  });

  assert.equal(result.success, false);
});

void test('FAB validation accepts the example file shape', () => {
  const result = validate({
    name: 'Example',
    description: '',
    skele: {
      angle: 0,
      mag: 1,
      children: [
        {
          angle: 0,
          mag: 0.25,
          uri: 'sprite:example/body',
          props: {hueRot: 0},
        },
      ],
    },
  });

  assert.equal(result.success, true);
});
