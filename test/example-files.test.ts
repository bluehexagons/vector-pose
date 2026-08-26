import {strict as assert} from 'node:assert';
import {globSync, readFileSync} from 'node:fs';
import {test} from 'node:test';
import type {FabData} from '../src/shared/types.ts';
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
  }
});
