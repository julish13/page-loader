import * as fsp from 'node:fs/promises';
import os from 'os';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import nock from 'nock';
import pageLoader from '../src/index';
import { NETWORK_ERROR_MESSAGES, FILESYSTEM_ERROR_MESSAGES } from '../src/errors';
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
  { name: 'ru-hexlet-io-packs-js-runtime.js', link: '/packs/js/runtime.js' },
];
let tempDir;
let resources = [];

beforeEach(async () => {
  tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('general flow', () => {
  beforeAll(async () => {
    resources = await Promise.all(
      resourcesData.map(async ({ name, link }) => {
        const content = await fsp.readFile(
          getFixturePath(path.join(assetsDirectoryName, name)),
          null,
        );
        nock('https://ru.hexlet.io').persist().get(link).reply(200, content);
        return { name, content };
      }),
    );
    nock('https://ru.hexlet.io').persist().get('/courses').reply(200, response);
  });

  afterAll(() => {
    nock.cleanAll();
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
});

describe('network errors', () => {
  afterEach(() => nock.cleanAll());
  test.each(Object.entries(NETWORK_ERROR_MESSAGES))(
    'response with status code %p throws the %p exception for the main page loading',
    async (code, message) => {
      nock('https://ru.hexlet.io').persist().get('/courses').reply(Number(code), null);

      try {
        await pageLoader(url, tempDir);
      } catch (error) {
        expect(error.message).toMatch(message);
      }
    },
  );

  test.each(Object.entries(NETWORK_ERROR_MESSAGES))(
    'response with status code %p throws the %p exception for resources loading',
    async (code, message) => {
      nock('https://ru.hexlet.io').persist().get('/courses').reply(200, response);
      resourcesData.forEach(({ link }) => {
        nock('https://ru.hexlet.io').persist().get(link).reply(Number(code), null);
      });

      try {
        await pageLoader(url, tempDir);
      } catch (error) {
        expect(error.message).toMatch(message);
      }
    },
  );

  test('uncustomized error message', async () => {
    nock('https://ru.hexlet.io').get('/courses').reply(403, null);

    await expect(async () => {
      await pageLoader(url, tempDir);
    }).rejects.toThrow();
  });
});

describe('file system errors', () => {
  afterEach(() => nock.cleanAll());
  beforeAll(async () => {
    resources = await Promise.all(
      resourcesData.map(async ({ name, link }) => {
        const content = await fsp.readFile(
          getFixturePath(path.join(assetsDirectoryName, name)),
          null,
        );
        nock('https://ru.hexlet.io').persist().get(link).reply(200, content);
        return { name, content };
      }),
    );
    nock('https://ru.hexlet.io').persist().get('/courses').reply(200, response);
  });

  test("the directory doesn't exist", async () => {
    const nonExistentDirectory = '/non-existent-dir';
    const message = FILESYSTEM_ERROR_MESSAGES.ENOENT(nonExistentDirectory);
    try {
      await pageLoader(url, nonExistentDirectory);
    } catch (error) {
      expect(error.message).toMatch(message);
    }
  });

  test('access to the directory is denied', async () => {
    const message = FILESYSTEM_ERROR_MESSAGES.EACCES(tempDir);
    await fsp.chmod(tempDir, 0o400);
    try {
      await pageLoader(url, tempDir);
    } catch (error) {
      expect(error.message).toMatch(message);
    }
  });
});
