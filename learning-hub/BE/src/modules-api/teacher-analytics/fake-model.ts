/* eslint-disable */
/**
 * Model Mongoose giả dùng riêng cho test: chạy được bộ lọc thật trên dữ liệu trong bộ nhớ
 * ({ field: x }, $in, $ne, $or, $regex) và các cập nhật $set/$addToSet/$pull, nên test phân
 * quyền và cô lập lớp kiểm tra hành vi thật chứ không chỉ kiểm tra lời gọi.
 */
export type Row = Record<string, any>;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function fakeModel(initial: Row[]) {
  const rows: Row[] = clone(initial).map((r: Row) => {
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v))
        r[k] = new Date(v);
    }
    return r;
  });
  const calls: Row[] = [];

  const matchCond = (v: unknown, cond: any): boolean => {
    if (cond instanceof RegExp) {
      return Array.isArray(v)
        ? v.some((x) => cond.test(String(x)))
        : cond.test(String(v ?? ''));
    }
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('$in' in cond) {
        const list = (cond.$in as unknown[]).map(String);
        return Array.isArray(v)
          ? v.some((x) => list.includes(String(x)))
          : list.includes(String(v));
      }
      if ('$ne' in cond) return String(v) !== String(cond.$ne);
      if ('$regex' in cond) {
        const rx = new RegExp(cond.$regex, cond.$options ?? '');
        return Array.isArray(v)
          ? v.some((x) => rx.test(String(x)))
          : rx.test(String(v ?? ''));
      }
    }
    return Array.isArray(v)
      ? v.map(String).includes(String(cond))
      : String(v) === String(cond);
  };
  const match = (row: Row, filter: Row): boolean =>
    Object.entries(filter).every(([k, cond]) =>
      k === '$or'
        ? (cond as Row[]).some((f) => match(row, f))
        : matchCond(row[k], cond),
    );

  const chain = (value: Row[]) => {
    let list = value;
    let skipN = 0;
    let limitN = Infinity;
    const c: any = {};
    c.select = jest.fn(() => c);
    c.sort = jest.fn((spec: Row) => {
      const keys = Object.entries(spec ?? {});
      list = [...list].sort((x, y) => {
        for (const [k, dir] of keys) {
          const a = x[k] instanceof Date ? x[k].getTime() : x[k];
          const b = y[k] instanceof Date ? y[k].getTime() : y[k];
          if (a === b) continue;
          if (a === undefined) return 1;
          if (b === undefined) return -1;
          return (a < b ? -1 : 1) * (Number(dir) < 0 ? -1 : 1);
        }
        return 0;
      });
      return c;
    });
    c.skip = jest.fn((n: number) => {
      skipN = n;
      return c;
    });
    c.limit = jest.fn((n: number) => {
      limitN = n;
      return c;
    });
    c.lean = jest.fn(async () => list.slice(skipN, skipN + limitN));
    return c;
  };
  const apply = (row: Row, update: Row) => {
    Object.assign(row, update.$set ?? {});
    for (const [k, v] of Object.entries<any>(update.$addToSet ?? {})) {
      const add = v && typeof v === 'object' && '$each' in v ? v.$each : [v];
      row[k] = [...new Set([...(row[k] ?? []), ...add])];
    }
    for (const [k, v] of Object.entries<any>(update.$pull ?? {})) {
      const drop =
        v && typeof v === 'object' && '$in' in v
          ? (v.$in as unknown[]).map(String)
          : [String(v)];
      row[k] = (row[k] ?? []).filter((x: unknown) => !drop.includes(String(x)));
    }
  };

  return {
    rows,
    calls,
    find: jest.fn((filter: Row = {}) => {
      calls.push(filter);
      return chain(rows.filter((r) => match(r, filter)));
    }),
    findById: jest.fn((id: string) => {
      const found = rows.find((r) => String(r._id) === id) ?? null;
      const q: any = { lean: jest.fn().mockResolvedValue(found) };
      q.select = jest.fn(() => q);
      return q;
    }),
    exists: jest.fn(async (filter: Row) =>
      rows.some((r) => match(r, filter)) ? { _id: 'x' } : null,
    ),
    findOneAndUpdate: jest.fn(async (filter: Row, update: Row) => {
      let row = rows.find((r) => match(r, filter));
      if (!row) {
        row = {
          _id: `64d${String(rows.length + 1).padStart(21, '0')}`,
          ...filter,
        };
        rows.push(row);
      }
      for (const [k, v] of Object.entries<number>(update.$inc ?? {})) {
        row[k] = (row[k] ?? 0) + v;
      }
      return row;
    }),
    findByIdAndUpdate: jest.fn((id: string, update: Row) => {
      const row = rows.find((r) => String(r._id) === id);
      if (row) apply(row, update);
      return { lean: jest.fn().mockResolvedValue(row ?? null) };
    }),
    updateOne: jest.fn(async (filter: Row, update: Row) => {
      const row = rows.find((r) => match(r, filter));
      if (row) apply(row, update);
      return { modifiedCount: row ? 1 : 0 };
    }),
    deleteMany: jest.fn(async (filter: Row) => {
      let n = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (match(rows[i], filter)) {
          rows.splice(i, 1);
          n++;
        }
      }
      return { deletedCount: n };
    }),
    countDocuments: jest.fn(
      async (filter: Row = {}) => rows.filter((r) => match(r, filter)).length,
    ),
    updateMany: jest.fn(async (filter: Row, update: Row) => {
      const hit = rows.filter((r) => match(r, filter));
      hit.forEach((r) => apply(r, update));
      return { modifiedCount: hit.length };
    }),
    deleteOne: jest.fn(async (filter: Row) => {
      const i = rows.findIndex((r) => match(r, filter));
      if (i >= 0) rows.splice(i, 1);
      return { deletedCount: i >= 0 ? 1 : 0 };
    }),
    create: jest.fn(async (doc: Row) => {
      const row = {
        _id: `64c${String(rows.length + 1).padStart(21, '0')}`,
        ...doc,
      };
      rows.push(row);
      return { toObject: () => row };
    }),
  };
}
