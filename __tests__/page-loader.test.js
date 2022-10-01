import * as fs from 'node:fs/promises';
import os from 'os';
import path from 'path';
import pageLoader from '../src/index';

const url = 'https://ru.hexlet.io/courses';
const expected = 'ru-hexlet-io-courses.html';
let tempDir;

// beforeAll();
beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('page download', async () => {
  const result = await pageLoader(url, tempDir);
  const ls = await fs.readdir(tempDir);

  expect(result).toBe(path.join(tempDir, expected));
  expect(ls).toHaveLength(1);
  expect(ls[0]).toEqual(expected);
});
