#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/index.js';

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o --output [dir]', `output dir (default: ${process.cwd()})`)
  .arguments('<url>')
  .action((url, option) => pageLoader(url, option.output)
    .then((res) => {
      console.log(`The page ${url} was successfully dowloaded into ${res}`);
    })
    .catch((error) => {
      console.error(`${error.message} while downloading the page ${url}`);
      process.exit(1);
    }));

program.parse(process.argv);
