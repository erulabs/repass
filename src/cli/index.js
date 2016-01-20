'use strong'

const cliName = 'repass'
const USAGE = `Usage: ${cliName} [options] <action> [key] [value]`

import { Repass } from './../lib/Repass.js'
import yargs from 'yargs'
import inquirer from 'inquirer'
import path from 'path'

const argv = yargs
  .usage(USAGE)
  // Common options:
  .help('h')
  .alias('h', 'help')
  // Options:
  .default('k', '~/.ssh/id_rsa')
  .alias('k', 'key')
  .describe('k', 'SSH key file')
  // Commands:
  // GET
  .command('get', 'get the password for a site')
  .example(`${cliName} get somesite.com`)
  // SET
  .command('set', 'set the password for a site')
  .example(`${cliName} set somesite.com`)
  // DEL
  .command('del', 'delete an entry')
  .example(`${cliName} del somesite.com`)
  // LS
  .command('ls', 'list entries')
  .example(`${cliName} ls`)
  // Generate
  .command('gen', 'Create a new password (without storing it)')
  .example(`${cliName} ls`)
  // Rekey
  .command('regen', 'Regenerate passwords')
  .example(`${cliName} regen [somesite.com]`)
  .demand(1)
  .argv

function getUserHome () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
}

inquirer.prompt([
  {
    name: 'password',
    type: 'password',
    message: 'Passphrase:'
  }, {
    name: 'otp',
    type: 'password',
    message: 'Yubikey OTP:'
  }
], function (result) {
  const repass = new Repass({
    otp: result.otp,
    key: path.normalize(argv.key.replace('~', getUserHome())),
    passphrase: result.otp
  })
  const doAction = function (action, args) {
    repass[action](...args)
  }
  const action = argv._.shift()
  if (action === 'get') {
    doAction('get', argv._)
  } else if (action === 'set') {
    doAction('set', argv._)
  } else if (action === 'del') {
    doAction('del', argv._)
  } else if (action === 'ls') {
    doAction('ls', argv._)
  } else if (action === 'regen') {
    doAction('regen', argv._)
  } else if (action === 'gen' || action === 'generate') {
    doAction('regen', argv._)
  } else {
    process.stdout.write(`${USAGE}\n`)
    process.exit(1)
  }
})
