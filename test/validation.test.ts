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

void test('FAB validation accepts skeletal vector drawings', () => {
  const result = validate({
    name: 'Vector example',
    drawings: [
      {
        id: 'curved-shape',
        fill: '#ff0066',
        fillRule: 'evenodd',
        fillOpacity: 0.8,
        stroke: '#220011',
        strokeWidth: 0.025,
        strokeLinecap: 'round',
        strokeLinejoin: 'bevel',
        strokeDasharray: [0.1, 0.05],
        commands: [
          {type: 'move', point: 'start'},
          {type: 'quadratic', control: 'control', point: 'end'},
          {
            type: 'cubic',
            control1: 'control-1',
            control2: 'control-2',
            point: 'start',
          },
          {type: 'close'},
        ],
      },
    ],
    skele: {angle: 0, mag: 1},
  });

  assert.equal(result.success, true);
});

void test('FAB validation rejects invalid vector paint and commands', () => {
  const result = validate({
    drawings: [
      {
        fillOpacity: 2,
        strokeWidth: -1,
        commands: [{type: 'line', point: ''}],
      },
    ],
    skele: {angle: 0, mag: 1},
  });

  assert.equal(result.success, false);
});
