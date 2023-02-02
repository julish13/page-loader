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
const assetsDirectoryName = 'ru-hexlet-io-courses_files';
const resourcesData = [
  { name: 'ru-hexlet-io-assets-professions-nodejs1.png', link: '/assets/professions/nodejs1.png' },
  { name: 'ru-hexlet-io-assets-professions-nodejs2.png', link: '/assets/professions/nodejs2.png' },
  { name: 'ru-hexlet-io-assets-application.css', link: '/assets/application.css' },
  { name: 'ru-hexlet-io-courses.html', link: '/courses' },
  { name: 'ru-hexlet-io-assets-application.css', link: '/assets/application.css' },
  { name: 'ru-hexlet-io-courses.html', link: '/packs/js/runtime.js' },
];
let tempDir;
let resources = [];

beforeEach(async () => {
  tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  resources = await Promise.all(
    resourcesData.map(async ({ name, link }) => {
      const content = await fsp.readFile(getFixturePath(name), null);
      nock('https://ru.hexlet.io').get(link).reply(200, content);
      return { name, content };
    }),
  );
  nock('https://ru.hexlet.io').get('/courses').reply(200, response);
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

test('resources downloaded', async () => {
  await pageLoader(url, tempDir);
  const directory = path.join(tempDir, assetsDirectoryName);
  const files = await fsp.readdir(directory);

  resources.forEach(async ({ name, content }) => {
    expect(files).toContain(name);
    const tempFile = await fsp.readFile(path.join(directory, name), null);
    expect(tempFile).toEqual(content);
  });
});
