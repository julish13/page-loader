import { load } from 'cheerio';
import * as fsp from 'node:fs/promises';
import path from 'path';
import axios from 'axios';

const isAbsoluteURL = (string) => {
  const regex = /^(?:[a-z+]+:)?\/\//i;
  return regex.test(string);
};

const normalizeString = (string) => {
  const regex = /[^A-Z0-9]+/gi;
  return string.replace(regex, '-');
};

const getNames = (url) => {
  const address = normalizeString(url.hostname + url.pathname);
  return [`${address}.html`, `${address}_files`];
};

const normalizeLink = (link, url) => {
  const extensionIndex = link.lastIndexOf('.');
  const body = link.slice(0, extensionIndex);
  const extension = link.slice(extensionIndex);
  return normalizeString(`${url.hostname}-${body}`) + extension;
};

const replaceImageLinks = ($, dirname, normalizedLinks) => {
  $('img').each(function (i) {
    const newSrc = `${dirname}/${normalizedLinks[i]}`;
    $(this).attr('src', newSrc);
  });
  return $.html();
};

const loadImages = (url, directory, links, normalizedLinks) => {
  const promises = links.map((link, i) => {
    const imageLink = `${isAbsoluteURL(link) ? '' : `${url.protocol}//${url.hostname}`}${link}`;
    return axios({
      method: 'get',
      responseType: 'stream',
      url: imageLink,
    })
      .then((res) => {
        const filepath = path.join(directory, normalizedLinks[i]);
        return fsp.writeFile(filepath, res.data);
      })
      .catch(console.log);
  });
  return promises;
};

const getImageLinks = ($) => $('img')
  .map(function () {
    return $(this).attr('src');
  })
  .toArray();

const pageLoader = (address, directory) => {
  const url = new URL(address);
  const [filename, dirname] = getNames(url);
  const assetsDirPath = path.join(directory, dirname);
  const pagePath = path.join(directory, filename);

  return Promise.all([axios.get(address), fsp.mkdir(assetsDirPath)])
    .then(([response]) => {
      const html = response.data;
      const $ = load(html);
      const links = getImageLinks($);
      const normalizedLinks = links.map((link) => normalizeLink(link, url));
      const newHtml = replaceImageLinks($, dirname, normalizedLinks);
      const promises = loadImages(url, assetsDirPath, links, normalizedLinks);
      return Promise.all([fsp.writeFile(pagePath, newHtml), ...promises]);
    })
    .then(() => pagePath)
    .catch(console.log);
};

export default pageLoader;
