import CacheUtils from './CacheUtils';

(async () => {
  await CacheUtils.set('test2', '456' + Date.now());
  await CacheUtils.setJson('test3', { a: 1, b: 2, c: 3 });
  await CacheUtils.setHash('test4', { a: 1, b: 2, c: 3 });

  let count = 0;
  await CacheUtils.pushToSet('test5', ++count);
  await CacheUtils.pushToSet('test5', ++count);
  await CacheUtils.pushToSet('test5', ++count);
  await CacheUtils.pushToSet('test5', ++count);
  await CacheUtils.pushToSet('test5', ++count);
  await CacheUtils.pushToSet('test5', 1);
  await CacheUtils.pushToSet('test5', 1);
  await CacheUtils.pushToSet('test5', 1);
  await CacheUtils.pushToSet('test5', 1);

  count = 0;
  await CacheUtils.pushToList('test6', ++count);
  await CacheUtils.pushToList('test6', ++count);
  await CacheUtils.pushToList('test6', ++count);
  await CacheUtils.pushToList('test6', ++count);
  await CacheUtils.pushToList('test6', ++count);
  await CacheUtils.pushToList('test6', 1);
  await CacheUtils.pushToList('test6', 1);
  await CacheUtils.pushToList('test6', 1);
  await CacheUtils.pushToList('test6', 1);

  console.log('test2', await CacheUtils.get('test2'));
  console.log('test3', await CacheUtils.getJson('test3'));
  console.log('test4', await CacheUtils.getHash('test4'));
  console.log('test5', await CacheUtils.getSet('test5'));
  console.log('test6', await CacheUtils.getList('test6'));
})()
