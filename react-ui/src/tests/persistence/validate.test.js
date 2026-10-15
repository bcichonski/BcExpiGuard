import {
  ensureDb,
  toPouch_id,
  fromPouch_id,
  transfromFromPouch,
} from '../../persistence/validate';

describe('persistence/validate', () => {
  describe('ensureDb', () => {
    it('throws error when dbprovider is missing', () => {
      expect(() => ensureDb(null, 'testdb', false)).toThrow(
        'No database provider'
      );
    });

    it('throws error when dbprovider is undefined', () => {
      expect(() => ensureDb(undefined, 'testdb', false)).toThrow(
        'No database provider'
      );
    });

    it('throws error when remote is true and user is not logged', () => {
      const dbprovider = {
        logged: false,
        local: { testdb: {} },
      };
      expect(() => ensureDb(dbprovider, 'testdb', true)).toThrow(
        'User not authenticated'
      );
    });

    it('throws error when dbprovider.local is missing', () => {
      const dbprovider = {
        logged: true,
      };
      expect(() => ensureDb(dbprovider, 'testdb', false)).toThrow(
        'Database provider not configured properly'
      );
    });

    it('throws error when dbprovider.local is null', () => {
      const dbprovider = {
        logged: true,
        local: null,
      };
      expect(() => ensureDb(dbprovider, 'testdb', false)).toThrow(
        'Database provider not configured properly'
      );
    });

    it('throws error when database is not registered in dbprovider.local', () => {
      const dbprovider = {
        logged: true,
        local: {
          otherdb: {},
        },
      };
      expect(() => ensureDb(dbprovider, 'testdb', false)).toThrow(
        'PouchDB database [testdb] not registered'
      );
    });

    it('succeeds when all conditions are met for local database', () => {
      const dbprovider = {
        logged: false,
        local: { testdb: {} },
      };
      expect(() => ensureDb(dbprovider, 'testdb', false)).not.toThrow();
    });

    it('succeeds when all conditions are met for remote database with login', () => {
      const dbprovider = {
        logged: true,
        local: { testdb: {} },
      };
      expect(() => ensureDb(dbprovider, 'testdb', true)).not.toThrow();
    });

    it('does not check login when remote is false', () => {
      const dbprovider = {
        logged: false,
        local: { testdb: {} },
      };
      expect(() => ensureDb(dbprovider, 'testdb', false)).not.toThrow();
    });
  });

  describe('toPouch_id', () => {
    it('moves id field to _id', () => {
      const payload = { id: '123', name: 'test' };
      const result = toPouch_id(payload);
      expect(result._id).toBe('123');
      expect(result.id).toBeUndefined();
      expect(result.name).toBe('test');
    });

    it('does not mutate the original input', () => {
      const payload = { id: '123', name: 'test' };
      const original = { ...payload };
      toPouch_id(payload);
      expect(payload).toEqual(original);
    });

    it('throws error when payload is null', () => {
      expect(() => toPouch_id(null)).toThrow('No payload to transfer');
    });

    it('throws error when payload is undefined', () => {
      expect(() => toPouch_id(undefined)).toThrow('No payload to transfer');
    });

    it('throws error when payload.id is missing', () => {
      const payload = { name: 'test' };
      expect(() => toPouch_id(payload)).toThrow("Couldn't find payload id");
    });

    it('throws error when payload.id is null', () => {
      const payload = { id: null, name: 'test' };
      expect(() => toPouch_id(payload)).toThrow("Couldn't find payload id");
    });

    it('throws error when payload.id is undefined', () => {
      const payload = { id: undefined, name: 'test' };
      expect(() => toPouch_id(payload)).toThrow("Couldn't find payload id");
    });

    it('preserves other properties in the cloned object', () => {
      const payload = { id: '123', name: 'test', data: { nested: 'value' } };
      const result = toPouch_id(payload);
      expect(result.name).toBe('test');
      expect(result.data).toEqual({ nested: 'value' });
    });
  });

  describe('fromPouch_id', () => {
    it('moves _id field to id', () => {
      const payload = { _id: '123', name: 'test' };
      const result = fromPouch_id(payload);
      expect(result.id).toBe('123');
      expect(result._id).toBeUndefined();
      expect(result.name).toBe('test');
    });

    it('returns payload as-is when it already has id and no _id', () => {
      const payload = { id: '123', name: 'test' };
      const result = fromPouch_id(payload);
      expect(result).toBe(payload);
      expect(result.id).toBe('123');
      expect(result._id).toBeUndefined();
    });

    it('throws error when payload is null', () => {
      expect(() => fromPouch_id(null)).toThrow('No payload to transfer');
    });

    it('throws error when payload is undefined', () => {
      expect(() => fromPouch_id(undefined)).toThrow('No payload to transfer');
    });

    it('throws error when payload has no _id and no id', () => {
      const payload = { name: 'test' };
      expect(() => fromPouch_id(payload)).toThrow("Couldn't find payload id");
    });

    it('throws error when _id is null and no id', () => {
      const payload = { _id: null, name: 'test' };
      expect(() => fromPouch_id(payload)).toThrow("Couldn't find payload id");
    });

    it('throws error when _id is undefined and no id', () => {
      const payload = { _id: undefined, name: 'test' };
      expect(() => fromPouch_id(payload)).toThrow("Couldn't find payload id");
    });

    it('preserves other properties when converting _id to id', () => {
      const payload = { _id: '123', name: 'test', data: { nested: 'value' } };
      const result = fromPouch_id(payload);
      expect(result.name).toBe('test');
      expect(result.data).toEqual({ nested: 'value' });
    });
  });

  describe('transfromFromPouch', () => {
    it('extracts doc from rows array', () => {
      const pouchResult = {
        rows: [
          { doc: { _id: '1', name: 'test1' } },
          { doc: { _id: '2', name: 'test2' } },
        ],
      };
      const result = transfromFromPouch(pouchResult);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('test1');
      expect(result[1].id).toBe('2');
      expect(result[1].name).toBe('test2');
    });

    it('handles single document instead of array', () => {
      const pouchResult = { _id: 'single', name: 'singleDoc' };
      const result = transfromFromPouch(pouchResult);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('single');
      expect(result[0].name).toBe('singleDoc');
    });

    it('filters out design documents starting with _design', () => {
      const pouchResult = {
        rows: [
          { doc: { _id: '1', name: 'test1' } },
          { doc: { _id: '_design/restrict', name: 'design' } },
          { doc: { _id: '2', name: 'test2' } },
          { doc: { _id: '_design/other', name: 'other_design' } },
        ],
      };
      const result = transfromFromPouch(pouchResult);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result.some((r) => r.id.startsWith('_design'))).toBe(false);
    });

    it('handles rows without doc property', () => {
      const pouchResult = {
        rows: [
          { _id: '1', name: 'test1' },
          { _id: '2', name: 'test2' },
        ],
      };
      const result = transfromFromPouch(pouchResult);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('handles mixed rows with and without doc property', () => {
      const pouchResult = {
        rows: [
          { doc: { _id: '1', name: 'test1' } },
          { _id: '2', name: 'test2' },
          { doc: { _id: '3', name: 'test3' } },
        ],
      };
      const result = transfromFromPouch(pouchResult);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('converts all _id to id in transformed result', () => {
      const pouchResult = {
        rows: [{ doc: { _id: 'abc', value: 123 } }],
      };
      const result = transfromFromPouch(pouchResult);
      expect(result[0]._id).toBeUndefined();
      expect(result[0].id).toBe('abc');
    });

    it('filters out all _design prefixed ids from single document', () => {
      const pouchResult = { _id: '_design/test', name: 'design' };
      const result = transfromFromPouch(pouchResult);
      expect(result).toHaveLength(0);
    });
  });
});
