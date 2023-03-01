import { createRequire } from 'module';
import * as fsp from 'node:fs/promises';
import path from 'path';
import debug from 'debug';
import { NETWORK_ERROR_MESSAGES, FILESYSTEM_ERROR_MESSAGES } from './const.js';

const require = createRequire(import.meta.url);
require('axios-debug-log');
const axios = require('axios');

const log = debug('page-loader');

const tagToSourceAttributeMapping = [
  { tag: 'img', attribute: 'src' },
  { tag: 'script', attribute: 'src' },
  { tag: 'link', attribute: 'href' },
];

const DEFAULT_EXTENSION = '.html';

const isAbsoluteURL = (string) => {
  const regex = /^(?:[a-z+]+:)?\/\//i;
  return regex.test(string);
};

const isSameDomainURLs = (url1, url2) => url1.hostname === url2.hostname;

const replaceSymbolsWithDash = (string) => {
  const regex = /[^A-Z0-9]+/gi;
  return string.replace(regex, '-');
};

export const fileSystemErrorHandler = (error, data) => {
  const { code } = error;
  log(`File System Error! ${error.message}`);
  throw new Error(FILESYSTEM_ERROR_MESSAGES[code](data) || error.message);
};

export const axiosErrorHandler = (error) => {
  const { status } = error.response;
  throw new Error(NETWORK_ERROR_MESSAGES[status] || error.message);
};

export const getAssetsNames = (url) => {
  const name = replaceSymbolsWithDash(url.hostname + url.pathname);
  return { filename: `${name}.html`, dirname: `${name}_files` };
};

const formatLink = (link, url) => {
  const { name, ext, dir } = path.parse(link);
  const result = `${replaceSymbolsWithDash(`${url.hostname}-${dir}-${name}`)}${
    ext || DEFAULT_EXTENSION
  }`;
  return result;
};

export const getLinks = ($, pageUrl) => tagToSourceAttributeMapping.flatMap((item) => {
  const { tag, attribute } = item;
  return $(tag)
    .map(function () {
      const rawLink = $(this).attr(attribute);
      const result = {
        tag,
        rawLink,
        link: rawLink,
        isAbsolute: null,
        formattedLink: null,
        isEmpty: true,
      };

      if (!rawLink) {
        return result;
      }

      let isAbsolute = isAbsoluteURL(rawLink);
      let { link } = result;

      if (isAbsolute) {
        const url = new URL(rawLink);
        if (isSameDomainURLs(pageUrl, url)) {
          isAbsolute = false;
          link = url.pathname;
        }
      } else {
        const { root } = path.parse(link);
        link = root ? link : `/${link}`;
      }
      const formattedLink = isAbsolute ? link : formatLink(link, pageUrl);

      return {
        ...result,
        isEmpty: false,
        link,
        isAbsolute,
        formattedLink,
      };
    })
    .toArray();
});

export const replaceLinks = ($, dirname, links) => {
  tagToSourceAttributeMapping.forEach(({ tag, attribute }) => {
    const filteredLinks = links.filter((link) => link.tag === tag);
    $(tag).each(function (i) {
      const { formattedLink, isAbsolute, isEmpty } = filteredLinks[i];
      if (isEmpty) {
        return;
      }
      if (!isAbsolute) {
        const newAttr = `${dirname}/${formattedLink}`;
        $(this).attr(attribute, newAttr);
      }
    });
  });

  return $.html();
};

const saveAsset = (filepath, data) => fsp.writeFile(filepath, data);

const downloadAsset = (url) => axios({
  method: 'get',
  responseType: 'stream',
  url,
});

export const processAssets = (url, directory, links) => {
  const promises = links.reduce((acc, {
    isEmpty, link, isAbsolute, formattedLink,
  }) => {
    if (isAbsolute || isEmpty) {
      return acc;
    }
    const address = `${url.protocol}//${url.hostname}${link}`;
    log(`downloading the page asset ${link}`);
    const promise = downloadAsset(address).then((res) => {
      log(`the asset ${link} has been downloaded`);
      log(`saving the asset ${link}`);
      const filepath = path.join(directory, formattedLink);
      return saveAsset(filepath, res.data)
        .then(() => log(`the asset ${link} has been saved as a ${filepath}`))
        .catch((error) => fileSystemErrorHandler(error, { directory }));
    });
    return [...acc, promise];
  }, []);
  return promises;
};
