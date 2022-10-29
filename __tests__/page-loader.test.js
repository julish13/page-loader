import * as fsp from 'node:fs/promises';
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../src/index';
import { response, expected } from '../__fixtures__/html';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const getFixturePath = (filename) => path.resolve(__dirname, '..', '__fixtures__', filename);

const url = 'https://ru.hexlet.io/courses';
const filename = 'ru-hexlet-io-courses.html';
const directoryName = 'ru-hexlet-io-courses_files';
const imageNames = [
  'ru-hexlet-io-assets-professions-nodejs.png',
  'ru-hexlet-io-assets-professions-nodejs2.png',
];
let tempDir;
let images = [];

// beforeAll();
beforeEach(async () => {
  tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  const image1 = await fsp.readFile(getFixturePath('image1.png'), null);
  const image2 = await fsp.readFile(getFixturePath('image2.png'), null);
  images = [image1, image2];
  nock('https://ru.hexlet.io').get('/courses').reply(200, response);
  nock('https://ru.hexlet.io').get('/assets/professions/nodejs.png').reply(200, image1);
  nock('https://ru.hexlet.io').get('/assets/professions/nodejs2.png').reply(200, image2);
});

test('page download', async () => {
  const result = await pageLoader(url, tempDir);
  const files = await fsp.readdir(tempDir);

  expect(result).toBe(path.join(tempDir, filename));
  expect(files).toContain(filename);
});

test('html is correct', async () => {
  await pageLoader(url, tempDir);
  const fileData = await fsp.readFile(path.join(tempDir, filename), { encoding: 'utf8' });
  expect(fileData).toEqual(expected);
});

test('images downloaded', async () => {
  await pageLoader(url, tempDir);
  const directory = path.join(tempDir, directoryName);
  const files = await fsp.readdir(directory);

  imageNames.forEach(async (name, i) => {
    expect(files).toContain(name);
    const tempFile = await fsp.readFile(path.join(directory, name), null);
    expect(tempFile).toEqual(images[i]);
  });
});
