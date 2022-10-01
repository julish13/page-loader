import * as fs from 'node:fs/promises';
import path from 'path';
import axios from 'axios';

const getFilename = (address) => {
  const extension = '.html';
  const url = new URL(address);
  const regex = /[^A-Z0-9]+/gi;
  const addressNormalized = (url.hostname + url.pathname).replace(regex, '-');
  return addressNormalized + extension;
};

const pageLoader = (address, directory) => {
  const filename = getFilename(address);
  const pathname = path.join(directory, filename);
  return axios
    .get(address)
    .then((response) => fs.writeFile(pathname, response.data))
    .then(() => pathname)
    .catch(console.log);
};

export default pageLoader;
