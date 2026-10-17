import { NAMESPACES, createUUID, newUUID } from '../../common/utils';

// User ids (and with them the local PouchDB names and remote filter params) derive from these v5 UUIDs.
// The expected values were computed with uuid 8.3.2, before the library upgrade, and must never change.
describe('createUUID (uuid v5) pins', () => {
  test('UserId namespace is stable', () => {
    expect(createUUID(NAMESPACES.UserId, 'jane@example.com')).toBe('a89aa511-98e3-5ee0-83a4-453f637b5444');
  });

  test('ItemName namespace is stable', () => {
    expect(createUUID(NAMESPACES.ItemName, 'Milk')).toBe('355b0768-30ca-5c82-9d2f-c67a779063b7');
  });

  test('CategoryName namespace is stable', () => {
    expect(createUUID(NAMESPACES.CategoryName, 'Dairy')).toBe('873243d7-db22-5227-94dc-9fa2c3c673d1');
  });

  test('newUUID returns distinct v4 ids', () => {
    const a = newUUID();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newUUID()).not.toBe(a);
  });
});
