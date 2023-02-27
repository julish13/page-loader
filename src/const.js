/* eslint-disable import/prefer-default-export */

export const NETWORK_ERROR_MESSAGES = {
  404: 'Not found',
  500: 'Internal Server Error',
};

export const FILESYSTEM_ERROR_MESSAGES = {
  ENOENT: ({ directory }) => `The directory ${directory} doesn't exist`,
  EACCES: ({ directory }) => `The access to the directory ${directory} is denied`,
};
