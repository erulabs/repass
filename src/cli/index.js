'use strong'

// Depedencies
const yargs = require('yargs')
const inquirer = require('inquirer')
const fs = require('fs')
const mkdirp = require('mkdirp')
const os = require('os')
const path = require('path')
const StatMode = require('stat-mode')
require('colors')

// System constants
const cliName = 'repass'
const USAGE = `Usage: ${cliName} [options] <action> [key] [value]`
const REPASS_DIR = os.homedir() + path.sep + '.repass'
const CONFIG_PATH = REPASS_DIR + path.sep + 'config.json'
const DB_PATH = REPASS_DIR + path.sep + 'db'

import { Repass } from './../lib/Repass.js'

const argv = yargs
  .usage(USAGE)
  // OTP choice (currently only Yubikey supported)
  .alias('c', 'yubicoClientId').describe('c', 'Yubico Client_ID')
  .alias('k', 'yubicoSecretKey').describe('k', 'Yubico Secret Key')
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
  .command('use', 'Change databases')
  .command('get', 'get the password for a site')
  .command('set', 'set the password for a site')
  .command('del', 'delete an entry')
  .command('ls', 'list databases or database entries')
  .command('gen', 'Create a new password (without storing it)')
  .command('regen', 'Regenerate passwords')
  .demand(1)
  .argv

// Setup helper to create config file
if (argv._[0] === 'setup') {
  if (fs.existsSync(CONFIG_PATH)) {
    console.log(`It appears you already have a config file at ${CONFIG_PATH}. Please remove it before running setup`)
    process.exit(1)
  }
  inquirer.prompt([
    {
      type: 'checkbox',
      message: 'Which OTP services would you like to use?',
      name: 'otp_services',
      choices: [
        { name: 'Yubikey' },
        { name: 'SMS', disabled: true },
        { name: 'Google Authenticator', disabled: true },
        { name: 'Facial Recognition', disabled: true }
      ],
      validate: function (answer) {
        if (answer.length < 1) return 'You must choose at least one OTP service.'
        return true
      }
    },
    {
      type: 'checkbox',
      message: 'Where would you like to store your vault?',
      name: 'storage',
      choices: [ { name: 'AWS S3' }, { name: 'local file' } ],
      validate: function (answer) {
        if (answer.length < 1) return 'You must choose at least one storage type.'
        return true
      }
    }
  ], function (result) {
    const questions = []
    if (result.storage.indexOf('AWS S3') > -1) {
      questions.push({ type: 'input', name: 'awsId', message: '(Use a minimal IAM profile for this)'.grey + ' AWS IAM ID:' })
      questions.push({ type: 'input', name: 'awsSecret', message: 'AWS IAM Secret:' })
      questions.push({ type: 'input', name: 'bucket', message: 'AWS bucket:' })
    }
    if (result.storage.indexOf('local file') > -1) {
      questions.push({ type: 'input', name: 'dbfile', message: 'encrypted database file:', default: DB_PATH })
    }
    if (result.otp_services.indexOf('Yubikey') > -1) {
      questions.push({ type: 'input', name: 'yubicoClientId', message: '(see https://upgrade.yubico.com/getapikey/Yubico)'.grey + ' Yubico Client Id:' })
      questions.push({ type: 'input', name: 'yubicoSecretKey', message: 'Yubico Secret Key:' })
    }
    inquirer.prompt(questions, function (result) {
      console.log('Configuration complete!')
      mkdirp(REPASS_DIR, () => {
        fs.writeFile(CONFIG_PATH, JSON.stringify(result, null, 4), () => {
          fs.chmod(CONFIG_PATH, '0600')
        })
        fs.chmod(REPASS_DIR, '0700')
      })
    })
  })
} else {
  // Contains options we pass to Repass lib (loaded from file)
  let config = {}
  if (fs.existsSync(CONFIG_PATH)) {
    const dirStats = new StatMode(fs.statSync(REPASS_DIR))
    const stats = new StatMode(fs.statSync(CONFIG_PATH))
    if (dirStats.group.read || dirStats.group.write ||
        dirStats.group.execute || dirStats.others.read ||
        dirStats.others.write || dirStats.others.execute ||
        stats.group.read || stats.group.write ||
        stats.group.execute || stats.others.read ||
        stats.others.write) {
      throw new Error('Insecure permissions in ' + REPASS_DIR)
    }
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH))
      if (typeof config !== 'object') throw new Error('Invalid config file: ', CONFIG_PATH)
    } catch (e) {
      throw e
    }
  }

  // Contains questions that need to be asked
  // TODO: Base questions on config / options
  const questions = [
    { name: 'passphrase', type: 'password', message: 'Passphrase:' },
    { name: 'otp', type: 'password', message: 'Yubikey OTP:' }
  ]

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
    const action = argv._.shift()
    if (!repass[action]) throw new Error(`No such action "${action}"`)
    repass.auth(() => {
      repass[action](arguments, () => {
        console.log(...arguments)
      })
    })
  })
}
