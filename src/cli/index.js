'use strong'

const cliName = 'repass'
const USAGE = `Usage: ${cliName} [options] <action> [key] [value]`
const REPASS_DIR = '~/.repass'
const CONFIG_PATH = `${REPASS_DIR}/config.json`
const DB_PATH = `${REPASS_DIR}/db`

import { Repass } from './../lib/Repass.js'
import yargs from 'yargs'
import inquirer from 'inquirer'
import fs from 'fs'
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
  .describe('write-config', `Saves current options as defaults to ${CONFIG_PATH}`)
  // Optional S3 creds
  .describe('bucket', 'AWS Bucket name (optional)')
  .describe('iam', 'AWS IAM ID (optional)')
  .describe('secret', 'AWS IAM Secret (optional)')
  // File
  .describe('db', 'File path for local storage (optional)')
  .default('db', DB_PATH)
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

// Contains options we pass to Repass lib (loaded from file)
let config = {}
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH))
    if (typeof config !== 'object') {
      throw new Error('Invalid config file: ', CONFIG_PATH)
    }
  } catch (e) {
    throw e
  }
}

// Contains questions that need to be asked
const questions = [{
  name: 'passphrase',
  type: 'password',
  message: 'Passphrase:'
}, {
  name: 'otp',
  type: 'password',
  message: 'Yubikey OTP:'
}]

inquirer.prompt(questions, function (result) {
  const options = {
    key: argv.i.replace('~', getUserHome()) || config.key,
    iam: argv.iam || config.iam,
    secret: argv.secret || config.secret,
    db: argv.db || config.db,
    bucket: argv.bucket || config.bucket,
    yubicoClientId: argv.yubicoClientId || config.yubicoClientId,
    yubicoSecretKey: argv.yubicoSecretKey || config.yubicoSecretKey
  }
  if (result['write-config']) {
    mkdirp(REPASS_DIR, () =>
      fs.writeFile(CONFIG_PATH, JSON.stringify(options), function () {
        fs.chmod(CONFIG_PATH, '0600')
      })
      fs.chmod(REPASS_DIR, '0700')
    )
  }
  // Note that we Object.assign so that there is no chance of otp / passphrase
  // leaking to config file
  const repass = new Repass(Object.assign({}, options, {
    otp: result.otp,
    passphrase: result.passphrase
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
