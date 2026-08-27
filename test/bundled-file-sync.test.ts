import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {shouldRefreshBundledFile} from '../src/utils/bundledFileSync.ts';

void test('missing bundled files are seeded', () => {
  assert.equal(
    shouldRefreshBundledFile(undefined, '/assets/example-a.json'),
    true
  );
});

void test('unchanged bundled files are left intact', () => {
  assert.equal(
    shouldRefreshBundledFile(
      {bundledUrl: '/assets/example-a.json'},
      '/assets/example-a.json'
    ),
    false
  );
});

void test('bundled files refresh when their build URL changes', () => {
  assert.equal(
    shouldRefreshBundledFile(
      {bundledUrl: '/assets/example-a.json'},
      '/assets/example-b.json'
    ),
    true
  );
});

void test('unmarked workspace files are treated as user-owned', () => {
  assert.equal(shouldRefreshBundledFile({}, '/assets/example-a.json'), false);
});
