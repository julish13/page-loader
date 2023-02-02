import * as fsp from 'node:fs/promises';
import path from 'path';
import axios from 'axios';

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

export const getLinks = ($, pageUrl) => {
  const result = tagToSourceAttributeMapping.flatMap((item) => {
    const { tag, attribute } = item;
    return $(tag)
      .map(function () {
        const rawLink = $(this).attr(attribute);
        let isAbsolute = isAbsoluteURL(rawLink);
        let link = rawLink;

        if (isAbsolute) {
          const url = new URL(rawLink);
          if (isSameDomainURLs(pageUrl, url)) {
            isAbsolute = false;
            link = url.pathname;
          }
        }

        const formattedLink = isAbsolute ? link : formatLink(link, pageUrl);

        return {
          tag, link, isAbsolute, formattedLink, rawLink,
        };
      })
      .toArray();
  });
  return result;
};

export const replaceLinks = ($, dirname, links) => {
  tagToSourceAttributeMapping.forEach(({ tag, attribute }) => {
    const filteredLinks = links.filter((link) => link.tag === tag);
    $(tag).each(function (i) {
      const { formattedLink, isAbsolute } = filteredLinks[i];
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
  const promises = links.reduce((acc, { link, isAbsolute, formattedLink }) => {
    if (isAbsolute) {
      return acc;
    }
    const address = `${url.protocol}//${url.hostname}${link}`;
    const promise = downloadAsset(address).then((res) => {
      const filepath = path.join(directory, formattedLink);
      return saveAsset(filepath, res.data);
    });
    // .catch(console.log);
    return [...acc, promise];
  }, []);
  return promises;
};
