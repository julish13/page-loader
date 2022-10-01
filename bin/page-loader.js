#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/index.js';

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o --output [dir]', 'output dir', '/home/user/')
  .arguments('<url>')
  .action((url) => {
    console.log(pageLoader(url));
  });
program.parse(process.argv);
