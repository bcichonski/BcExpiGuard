import { vi } from 'vitest';

vi.mock('../../persistence', () => ({
  __esModule: true,
  default: { setSyncHooks: vi.fn(), startSync: vi.fn() },
  itemNames: { getAll: vi.fn(), add: vi.fn().mockResolvedValue(undefined) },
  items: { getAll: vi.fn(), add: vi.fn().mockResolvedValue(undefined) },
}));

import store from '../../common/store';
import { appActions } from '../../logic/appstate';
import { itemNames, items } from '../../persistence';
import dbProvider from '../../persistence';

const storedNames = [{ id: 'n1', name: 'Milk' }];
const storedItems = [{ id: 'i1', nameID: 'n1', date: '2030-01-01', quantity: 1, unit: 'l', state: 'active' }];

describe('store', () => {
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('runs thunks (thunk middleware is included by default)', async () => {
    itemNames.getAll.mockResolvedValue(storedNames);
    items.getAll.mockResolvedValue(storedItems);

    await store.dispatch(appActions.initialize({}));

    const state = store.getState();
    expect(state.itemNameReducer).toEqual([expect.objectContaining({ id: 'n1', name: 'Milk' })]);
    expect(state.itemReducer).toEqual([expect.objectContaining({ id: 'i1', nameID: 'n1' })]);
    expect(dbProvider.startSync).toHaveBeenCalledTimes(1);
  });

  it('accumulates errors through the real store without tripping the dev mutation check', async () => {
    store.dispatch(appActions.appError('first'));
    const before = store.getState().appStateReducer;
    store.dispatch(appActions.appError('second'));

    const after = store.getState().appStateReducer;
    expect(after.errors.slice(-2)).toEqual(['first', 'second']);
    expect(before.errors).not.toBe(after.errors);
    expect(before.lastError).toBe('first');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('reports no immutability or serializability warnings for the initialize flow', async () => {
    itemNames.getAll.mockResolvedValue([]);
    items.getAll.mockResolvedValue([]);

    await store.dispatch(appActions.initialize({}));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
