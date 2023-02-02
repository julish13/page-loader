import { load } from 'cheerio';
import * as fsp from 'node:fs/promises';
import path from 'path';
import axios from 'axios';
import {
  getAssetsNames, getLinks, replaceLinks, processAssets,
} from './utils';

const pageLoader = (address, directory) => {
  const url = new URL(address);
  const { filename, dirname } = getAssetsNames(url);
  const assetsDirPath = path.join(directory, dirname);
  const pagePath = path.join(directory, filename);

  return Promise.all([axios.get(address), fsp.mkdir(assetsDirPath)])
    .then(([response]) => {
      const html = response.data;
      const $ = load(html);
      const links = getLinks($, url);
      const newHtml = replaceLinks($, dirname, links);
      const promises = processAssets(url, assetsDirPath, links);
      return Promise.all([fsp.writeFile(pagePath, newHtml), ...promises]);
    })
    .then(() => pagePath);
  // .catch(console.log);
};

export default pageLoader;
