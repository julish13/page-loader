import * as fs from 'node:fs/promises';
import os from 'os';
import path from 'path';
import nock from 'nock';
import pageLoader from '../src/index';

const url = 'https://ru.hexlet.io/courses';
const expectedData = '<!DOCTYPE html><html><head></head><body></body></html>';
const filename = 'ru-hexlet-io-courses.html';
let tempDir;

// beforeAll();
beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('page download', async () => {
  nock('https://ru.hexlet.io').get('/courses').reply(200, expectedData);

  const result = await pageLoader(url, tempDir);
  const fileData = await fs.readFile(path.join(tempDir, filename), { encoding: 'utf8' });

  expect(result).toBe(path.join(tempDir, filename));
  expect(fileData).toEqual(expectedData);
});
