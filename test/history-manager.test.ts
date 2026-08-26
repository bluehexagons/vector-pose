import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {HistoryManager} from '../src/utils/HistoryManager.ts';

void test('history continuity coalesces updates while preserving the undo point', () => {
  const history = new HistoryManager<number>();

  history.pushState(0, 'Initial');
  history.pushState(1, 'Dragging', 'drag');
  history.pushState(2, 'Dragging', 'drag');

  assert.equal(history.getEntries().length, 2);
  assert.equal(history.getCurrentState()?.state, 2);
  assert.equal(history.undo()?.state, 0);
  assert.equal(history.redo()?.state, 2);
});

void test('history enforces a usable minimum size', () => {
  const history = new HistoryManager<number>(0);

  history.pushState(1, 'Only state');

  assert.equal(history.getCurrentIndex(), 0);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);
});
