import { createRequire } from 'module';
import { load } from 'cheerio';
import * as fsp from 'node:fs/promises';
import path from 'path';
import process from 'process';
import debug from 'debug';
import {
  getAssetsNames, getLinks, replaceLinks, processAssets,
} from './utils.js';
import { NETWORK_ERROR_MESSAGES } from './const';

const axiosErrorHandler = (error) => {
  const { status: statusCode } = error.response;
  throw new Error(NETWORK_ERROR_MESSAGES[statusCode] || error.message);
};

const require = createRequire(import.meta.url);
require('axios-debug-log');
const axios = require('axios');

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    axiosErrorHandler(error);
  },
);

const log = debug('page-loader');
const currentDir = process.cwd();

const pageLoader = (address, directory = currentDir) => {
  const url = new URL(address);
  log(`preparing paths in ${directory} for the page ${address} and its assets`);
  const { filename, dirname } = getAssetsNames(url);
  const assetsDirPath = path.join(directory, dirname);
  const pagePath = path.join(directory, filename);

  log('creating directory for the page assets');
  log(`downloading the page ${address}`);
  return Promise.all([
    axios.get(address),
    fsp.mkdir(assetsDirPath).then(() => {
      log(`directory for the page assets has been created at the ${assetsDirPath}`);
    }),
  ])
    .then(([response]) => {
      log(`the page ${address} has been downladed`);
      log('processing the downloaded page');
      const html = response.data;
      const $ = load(html);
      const links = getLinks($, url);
      const newHtml = replaceLinks($, dirname, links);
      const promises = processAssets(url, assetsDirPath, links);
      log(`saving the page ${address}`);
      return Promise.all([
        fsp.writeFile(pagePath, newHtml).then(() => {
          log(`the page ${address} has been saved as a ${pagePath}`);
        }),
        ...promises,
      ]);
    })
    .then(() => pagePath);
  // .catch(console.log);
};

export default pageLoader;
