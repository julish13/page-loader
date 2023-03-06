import { createRequire } from 'module';
import { load } from 'cheerio';
import * as fsp from 'node:fs/promises';
import path from 'path';
import process from 'process';
import debug from 'debug';
import Listr from 'listr';

import {
  getAssetsNames, getLinks, replaceLinks, processAssets,
} from './utils.js';
import { errorHandler } from './errors/index.js';

const require = createRequire(import.meta.url);
require('axios-debug-log');
const axios = require('axios');

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    errorHandler(error);
  },
);

const log = debug('page-loader');

const pageLoader = (address, directory = process.cwd()) => {
  log(
    `program starts with the following parameters: address = ${address}, directory=${directory}; currentDir=${process.cwd()}`,
  );
  const url = new URL(address);
  const { filename, dirname } = getAssetsNames(url);
  const assetsDirPath = path.join(directory, dirname);
  const pagePath = path.join(directory, filename);

  log('creating directory for the page assets');
  return Promise.all([
    axios.get(address),
    fsp
      .mkdir(assetsDirPath)
      .then(() => {
        log(`directory for the page assets has been created at the ${assetsDirPath}`);
      })
      .catch((error) => errorHandler(error, { directory })),
  ])
    .then(([response]) => {
      log('processing the downloaded page');
      const html = response.data;
      const $ = load(html);
      const links = getLinks($, url);
      const newHtml = replaceLinks($, dirname, links);
      const tasks = processAssets(url, assetsDirPath, links).map(({ promise, link }) => ({
        title: `downloading the asset ${link} and saving in the ${assetsDirPath}`,
        task: () => promise,
      }));
      log(`saving the page ${address}`);
      return Promise.all([
        fsp
          .writeFile(pagePath, newHtml)
          .then(() => {
            log(`the page ${address} has been saved as a ${pagePath}`);
          })
          .catch((error) => errorHandler(error, { directory })),
        new Listr(tasks, { concurrent: true, exitOnError: false }).run().catch(() => {}),
      ]);
    })
    .then(() => pagePath);
};

export default pageLoader;
