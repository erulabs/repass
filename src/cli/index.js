'use strong'

const cliName = 'repass'
const USAGE = `Usage: ${cliName} [options] <action> [key] [value]`

import { Repass } from './../lib/Repass.js'
import yargs from 'yargs'
import inquirer from 'inquirer'
import path from 'path'
import mkdirp from 'mkdirp'

const argv = yargs
  .usage(USAGE)
  .command('setup', 'setup helper for getting started')

  .alias('c', 'yubicoClientId')
  .describe('c', 'Yubico Client_ID')
  .demand('c')
  .alias('k', 'yubicoSecretKey')
  .describe('k', 'Yubico Secret Key')
  .demand('k')
  // Options:
  .describe('i', 'SSH key file')
  .default('i', '~/.ssh/id_rsa')
  .alias('i', 'identity-file')
  // Optional S3 creds
  .describe('bucket', 'AWS Bucket name (optional)')
  .describe('iam', 'AWS IAM ID (optional)')
  .describe('secret', 'AWS IAM Secret (optional)')
  // File
  .describe('db', 'File path for local storage (optional)')
  .default('db', '~/.repass/db')
  // Commands:
  .command('get', 'get the password for a site')
  .command('set', 'set the password for a site')
  .command('del', 'delete an entry')
  .command('ls', 'list entries')
  .command('gen', 'Create a new password (without storing it)')
  .command('regen', 'Regenerate passwords')
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
    key: path.normalize(argv.i.replace('~', getUserHome())),
    passphrase: result.otp,
    client_id: argv.c,
    secret_key: argv.k,
    iam: argv.iam,
    secret: argv.secret,
    db: argv.db,
    bucket: argv.bucket,
    yubicoClientId: argv.yubicoClientId,
    yubicoSecretKey: argv.yubicoSecretKey
  })
  const doAction = function (action, args) {
    repass.auth(() => {
      repass[action](...args)
    })
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
