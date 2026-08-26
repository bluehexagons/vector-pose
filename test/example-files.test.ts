import {strict as assert} from 'node:assert';
import {existsSync, globSync, readFileSync} from 'node:fs';
import {test} from 'node:test';
import type {FabData, VectorDrawing} from '../src/shared/types.ts';
import {fromSpriteUri} from '../src/shared/types.ts';
import {SkeleNode} from '../src/utils/SkeleNode.ts';
import {buildVectorPath} from '../src/utils/vectorDrawing.ts';
import {validate} from '../src/validation/fabSchema.ts';

void test('bundled FAB files validate and vector points resolve', () => {
  const filePaths = globSync('example/data/fabs/**/*.fab.json');
  assert.ok(filePaths.length > 0);

  for (const filePath of filePaths) {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    const result = validate(parsed);
    assert.equal(
      result.success,
      true,
      `${filePath}: ${result.error?.message ?? 'invalid FAB data'}`
    );

    const fabData = result.data as FabData;
    const skele = SkeleNode.fromData(fabData.skele);
    skele.tickMove(0, 0, 1, 0);
    skele.updateState(1);

    for (const drawing of fabData.drawings ?? []) {
      assert.notEqual(
        buildVectorPath(drawing, skele),
        null,
        `${filePath}: ${drawing.id ?? 'unnamed drawing'} has a missing point`
      );
    }

    for (const node of skele.walk()) {
      if (!node.uri) continue;
      const assetPath = `example/${fromSpriteUri(node.uri).replace(/^\.\//, '')}`;
      assert.ok(existsSync(assetPath), `${filePath}: missing ${assetPath}`);
    }
  }
});

function loadExample(fileName: string): FabData {
  const parsed: unknown = JSON.parse(
    readFileSync(`example/data/fabs/vector/${fileName}`, 'utf8')
  );
  const result = validate(parsed);
  assert.equal(result.success, true);
  return result.data as FabData;
}

void test('winding example covers fill, cap, join, and dash options', () => {
  const drawings = loadExample('winding-rules.fab.json').drawings ?? [];
  const values = <Key extends keyof VectorDrawing>(key: Key) =>
    new Set(drawings.map(drawing => drawing[key]));

  assert.ok(values('fillRule').has('nonzero'));
  assert.ok(values('fillRule').has('evenodd'));
  assert.ok(values('strokeLinecap').has('butt'));
  assert.ok(values('strokeLinecap').has('round'));
  assert.ok(values('strokeLinecap').has('square'));
  assert.ok(values('strokeLinejoin').has('round'));
  assert.ok(values('strokeLinejoin').has('bevel'));
  assert.ok(values('strokeLinejoin').has('miter'));
  assert.ok(drawings.some(drawing => drawing.strokeDasharray));
  assert.ok(drawings.some(drawing => drawing.fillOpacity !== undefined));
  assert.ok(drawings.some(drawing => drawing.strokeOpacity !== undefined));
  assert.ok(drawings.some(drawing => drawing.opacity !== undefined));
});

void test('vector examples organize points into nested control rigs', () => {
  const curves = SkeleNode.fromData(
    loadExample('curves-and-strokes.fab.json').skele
  );
  assert.equal(curves.findId('smile_control')?.parent?.id, 'face_controls');
  assert.equal(curves.findId('dash_c1')?.parent?.id, 'flourish_controls');

  const motion = SkeleNode.fromData(
    loadExample('nested-control-motion.fab.json').skele
  );
  assert.equal(motion.findId('stem_sway')?.parent?.id, 'stem_base');
  assert.equal(motion.findId('stem_mid')?.parent?.id, 'stem_sway');
  assert.equal(motion.findId('bloom_center')?.parent?.id, 'stem_mid');
  assert.equal(motion.findId('bloom_top')?.parent?.id, 'bloom_shape');
  assert.equal(motion.findId('leaf_tip')?.parent?.id, 'leaf_shape');
});

void test('shape studies cover straight, quadratic, cubic, and compound paths', () => {
  const drawings = loadExample('shape-studies.fab.json').drawings ?? [];
  const commandTypes = new Set(
    drawings.flatMap(drawing => drawing.commands.map(command => command.type))
  );

  assert.deepEqual(
    commandTypes,
    new Set(['move', 'line', 'close', 'cubic', 'quadratic'])
  );
  assert.ok(
    drawings.some(
      drawing =>
        drawing.fillRule === 'nonzero' &&
        drawing.commands.filter(command => command.type === 'move').length > 1
    )
  );
});

void test('character examples provide articulated limb chains', () => {
  for (const fileName of ['gesture-figure.fab.json', 'robot-puppet.fab.json']) {
    const character = SkeleNode.fromData(loadExample(fileName).skele);

    assert.equal(character.findId('left_elbow')?.parent?.id, 'left_shoulder');
    assert.equal(
      character.findId('left_hand')?.parent?.id ??
        character.findId('left_claw')?.parent?.id,
      'left_elbow'
    );
    assert.equal(character.findId('right_knee')?.parent?.id, 'right_hip');
    assert.equal(
      character.findId('right_ankle')?.parent?.id ??
        character.findId('right_foot')?.parent?.id,
      'right_knee'
    );
  }
});

void test('character facial features remain level and mirrored', () => {
  for (const fileName of ['gesture-figure.fab.json', 'robot-puppet.fab.json']) {
    const character = SkeleNode.fromData(loadExample(fileName).skele);
    character.tickMove(0, 0, 1, 270);

    const position = (id: string) => {
      const node = character.findId(id);
      assert.ok(node, `${fileName}: missing ${id}`);
      return node.state.transform;
    };
    const center = position('head_center');
    const leftTop = position(
      fileName.startsWith('gesture') ? 'left_eye_top' : 'eye_left'
    );
    const leftBottom = position(
      fileName.startsWith('gesture') ? 'left_eye_bottom' : 'eye_left_end'
    );
    const rightTop = position(
      fileName.startsWith('gesture') ? 'right_eye_top' : 'eye_right'
    );
    const rightBottom = position(
      fileName.startsWith('gesture') ? 'right_eye_bottom' : 'eye_right_end'
    );

    assert.ok(Math.abs(leftTop[1] - rightTop[1]) < 0.001);
    assert.ok(Math.abs(leftBottom[1] - rightBottom[1]) < 0.001);
    assert.ok(Math.abs(leftTop[0] + rightTop[0] - center[0] * 2) < 0.001);
    assert.ok(Math.abs(leftBottom[0] - leftTop[0]) < 0.001);
    assert.ok(Math.abs(rightBottom[0] - rightTop[0]) < 0.001);
  }
});

void test('shape study window corners stay rectangular', () => {
  const shapes = SkeleNode.fromData(
    loadExample('shape-studies.fab.json').skele
  );
  shapes.tickMove(0, 0, 1, 270);
  const position = (id: string) => {
    const node = shapes.findId(id);
    assert.ok(node, `missing ${id}`);
    return node.state.transform;
  };
  const topLeft = position('window_top_left');
  const topRight = position('window_top_right');
  const bottomRight = position('window_bottom_right');
  const bottomLeft = position('window_bottom_left');

  assert.ok(Math.abs(topLeft[0] - bottomLeft[0]) < 0.004);
  assert.ok(Math.abs(topRight[0] - bottomRight[0]) < 0.004);
  assert.ok(Math.abs(topLeft[1] - topRight[1]) < 0.004);
  assert.ok(Math.abs(bottomLeft[1] - bottomRight[1]) < 0.004);
});

void test('nested motion pivots affect only their descendant artwork', () => {
  const motion = SkeleNode.fromData(
    loadExample('nested-control-motion.fab.json').skele
  );
  const tick = () => motion.tickMove(0, 0, 1, 270);
  const position = (id: string) => {
    const node = motion.findId(id);
    assert.ok(node, `missing ${id}`);
    return Array.from(node.state.transform);
  };

  tick();
  const baseBefore = position('stem_base');
  const bloomBefore = position('bloom_center');
  const stemSway = motion.findId('stem_sway');
  assert.ok(stemSway);
  stemSway.rotation += Math.PI / 6;
  stemSway.updateTransform();
  tick();

  assert.deepEqual(position('stem_base'), baseBefore);
  assert.notDeepEqual(position('bloom_center'), bloomBefore);

  const bloomPointBefore = position('bloom_top');
  const leafPointBefore = position('leaf_tip');
  const leafShape = motion.findId('leaf_shape');
  assert.ok(leafShape);
  leafShape.rotation -= Math.PI / 5;
  leafShape.updateTransform();
  tick();

  assert.deepEqual(position('bloom_top'), bloomPointBefore);
  assert.notDeepEqual(position('leaf_tip'), leafPointBefore);
});
