#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/index.js';

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o --output [dir]', 'output dir')
  .arguments('<url>')
  .action((url) => {
    pageLoader(url, program.opts().output).then(console.log);
  });
program.parse(process.argv);
