'use strong'

// Depedencies
const yargs = require('yargs')
const inquirer = require('inquirer')
const fs = require('fs')
const mkdirp = require('mkdirp')

// System constants
const cliName = 'repass'
const USAGE = `Usage: ${cliName} [options] <action> [key] [value]`
const REPASS_DIR = '~/.repass'
const CONFIG_PATH = `${REPASS_DIR}/config.json`
const DB_PATH = `${REPASS_DIR}/db`

import { Repass } from './../lib/Repass.js'

const argv = yargs
  .usage(USAGE)
  // OTP choice (currently only Yubikey supported)
  .alias('c', 'yubicoClientId').describe('c', 'Yubico Client_ID').demand('c')
  .alias('k', 'yubicoSecretKey').describe('k', 'Yubico Secret Key').demand('k')
  // Options:
  .describe('writeConfig', `Saves current options as defaults to ${CONFIG_PATH}`)
  // Optional S3 creds
  .describe('bucket', 'AWS Bucket name (optional)')
  .describe('awsId', 'AWS IAM ID (optional)')
  .describe('awsSecret', 'AWS IAM Secret (optional)')
  // File
  .describe('db', 'File path for local storage (optional)').default('db', DB_PATH)
  // Commands:
  .command('setup', 'setup helper for getting started')
  .command('get', 'get the password for a site')
  .command('set', 'set the password for a site')
  .command('del', 'delete an entry')
  .command('ls', 'list entries')
  .command('gen', 'Create a new password (without storing it)')
  .command('regen', 'Regenerate passwords')
  .demand(1)
  .argv

// Contains options we pass to Repass lib (loaded from file)
let config = {}
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH))
    if (typeof config !== 'object') throw new Error('Invalid config file: ', CONFIG_PATH)
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
    awsId: argv.awsId || config.awsId,
    awsSecret: argv.awsSecret || config.awsSecret,
    db: argv.db || config.db,
    bucket: argv.bucket || config.bucket,
    yubicoClientId: argv.yubicoClientId || config.yubicoClientId,
    yubicoSecretKey: argv.yubicoSecretKey || config.yubicoSecretKey
  }
  if (result.writeConfig) {
    mkdirp(REPASS_DIR, () => {
      fs.writeFile(CONFIG_PATH, JSON.stringify(options), () => { fs.chmod(CONFIG_PATH, '0600') })
      fs.chmod(REPASS_DIR, '0700')
    })
  }
  const repass = new Repass(Object.assign({}, options, { otp: result.otp, passphrase: result.passphrase }))
  function doAction (action, args) { repass.auth(() => { repass[action](...args) }) }
  const action = argv._.shift()
  if (action === 'get') doAction('get', argv._)
  else if (action === 'set') doAction('set', argv._)
  else if (action === 'del') doAction('set', null)
  else if (action === 'ls') doAction('ls', argv._)
  else if (action === 'regen') doAction('regen', argv._)
  else if (action === 'gen' || action === 'generate') doAction('regen', argv._)
  else {
    process.stdout.write(`${USAGE}\n`)
    process.exit(1)
  }
})
