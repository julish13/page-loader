#!/usr/bin/env node

import { program } from 'commander';

program
  .version('1.0.0')
  .description('Page loader utility')
  .option('-o --output [dir]', 'output dir', '/home/user/')
  .arguments('<url>')
  .action(
    (url) => console.log(url),
    //   (filepath1, filepath2) => {
    //   console.log(gendiff(filepath1, filepath2, program.opts().format));
    // }
  );
program.parse(process.argv);
