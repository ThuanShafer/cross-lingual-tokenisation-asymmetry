import "server-only";

/** Interleaves several async iterables, yielding values in arrival order. */
export async function* mergeAsync(iterables) {
  const iterators = iterables.map((it) => it[Symbol.asyncIterator]());
  const pending = new Map(iterators.map((it, i) => [i, it.next().then((result) => ({ i, result }))]));

  try {
    while (pending.size) {
      const { i, result } = await Promise.race(pending.values());
      if (result.done) {
        pending.delete(i);
      } else {
        pending.set(i, iterators[i].next().then((next) => ({ i, result: next })));
        yield result.value;
      }
    }
  } finally {
    await Promise.allSettled(iterators.map((it) => it.return?.()));
  }
}
