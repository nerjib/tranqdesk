const Chalk = require('chalk');
const {cp} = require('fs/promises');
const Path = require('path');

async function copy() {
  try {
    await cp(
        Path.join(__dirname, '..', '..', 'src', 'main'),
        Path.join(__dirname, '..', '..', 'build', 'main'),
        {
          recursive: true,
        },
    );

    console.log(Chalk.yellowBright('Moved main folder to build'));
  } catch (error) {
    throw error;
  }
}

module.exports = copy;