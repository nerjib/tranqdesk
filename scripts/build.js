process.env.NODE_ENV = 'production';

const Path = require('path');
const Chalk = require('chalk');
const FileSystem = require('fs');
const copyMain = require('./private/copy');

async function buildRenderer() {
  const Vite = require('vite');

  return Vite.build({
    base: './',
    mode: 'production',
  });
}

async function buildMain() {
  await copyMain();
}

FileSystem.rmSync(Path.join(__dirname, '..', 'build'), {
  recursive: true,
  force: true,
});

console.log(Chalk.blueBright('Transpiling renderer & main...'));

async function start() {
  buildRenderer();
  buildMain();
  console.log(Chalk.greenBright('Renderer & main successfully transpiled! (ready to be built with electron-builder)'));
}

start();