#!/usr/bin/env node

import debug from 'debug';
import { program } from 'commander';
import pageLoader from '../src/index.js';

const currentDir = process.cwd();

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o --output [dir]', `output dir (default: ${currentDir})`, currentDir)
  .option('-d --debug', 'enables debug logger')
  .arguments('<url>')

  .action((url, option) => {
    if (option.debug) {
      debug.enable('page-loader*,axios');
    }
    return pageLoader(url, option.output)
      .then((res) => {
        console.log(`The page ${url} was successfully dowloaded into ${res}`);
      })
      .catch((error) => {
        console.error(`${error.message} while downloading the page ${url}`);
        process.exit(1);
      });
  });

program.parse(process.argv);
