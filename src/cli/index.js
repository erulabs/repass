'use strong'

// Depedencies
const yargs = require('yargs')
const inquirer = require('inquirer')
const fs = require('fs')
const mkdirp = require('mkdirp')
const os = require('os')
const path = require('path')
const StatMode = require('stat-mode')
// const Random = require('random-js')
const faker = require('faker')
// const mt19937 = Random.engines.mt19937().autoSeed()
require('colors')

// System constants
const cliName = 'repass'
const USAGE = `Usage: ${cliName} [options] <action> [key] [value]`
const REPASS_DIR = path.join(os.homedir(), '.repass')
const CONFIG_PATH = path.join(REPASS_DIR, 'config.json')
const DB_PATH = path.join(REPASS_DIR, 'db')
import { Repass } from './../lib/Repass.js'

const cliError = (str) => {
  process.stderr.write(`${str}\n`)
  process.exit(1)
}

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
  .command('setup', 'Setup helper for getting started')
  .command('use', 'Change databases')
  .command('get', 'Get a secret')
  .command('set', 'Set a secret')
  .command('del', 'Delete an entry')
  .command('ls', 'List databases or database entries')
  .command('gen', 'Create a new password (without storing it)')
  .command('regen', 'Regenerate passwords')
  .demand(1)
  .argv

// Setup helper to create config file
if (argv._[0] === 'setup') {
  if (fs.existsSync(CONFIG_PATH)) {
    // TODO: We should allow modifying the config with this helper
    cliError(`It appears you already have a config file at ${CONFIG_PATH}. Please remove it before running setup`)
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
      choices: [ { name: 'AWS S3' }, { name: 'Locally (encrypted file)' } ],
      validate: function (answer) {
        if (answer.length < 1) return 'You must choose at least one storage type.'
        return true
      }
    }
  ]).then(function (result) {
    const questions = []
    if (result.storage.indexOf('AWS S3') > -1) {
      questions.push({ type: 'input', name: 's3_iam_id', message: '(Use a minimal IAM profile for this)'.grey + ' AWS IAM ID:' })
      questions.push({ type: 'input', name: 's3_iam_secret', message: 'AWS IAM Secret:' })
      questions.push({ type: 'input', name: 's3_bucket', message: 'AWS bucket:' })
    }
    if (result.storage.indexOf('local file') > -1) {
      questions.push({ type: 'input', name: 'file', message: 'encrypted database file:', default: DB_PATH })
    }
    if (result.otp_services.indexOf('Yubikey') > -1) {
      questions.push({ type: 'input', name: 'yubicoClientId', message: '(see https://upgrade.yubico.com/getapikey)'.grey + ' Yubico Client Id:' })
      questions.push({ type: 'input', name: 'yubicoSecretKey', message: 'Yubico Secret Key:' })
    }
    if (result.otp_services.indexOf('SMS') > -1) {
      questions.push({ type: 'input', name: 'twilio_id', message: 'Twilio API ID:' })
      questions.push({ type: 'input', name: 'twilio_secret', message: 'Twiio API secret:' })
    }
    inquirer.prompt(questions).then(function (result) {
      result.vaults = []
      // TODO Handle errors ofc
      // The verification token should be pushed up with any remote storage option encrypted with a secret about the
      // remote service. For instance part of the IAM id/key for AWS S3 and a locally stored fragment like a datetime.
      // On pulling secrets, we verify that the host matches the local secrets. It's not a deal breaker if they don't,
      // but we'll alert the user (This is essentially host-key varification, but service-agnostic and with a bit of
      // security-thru-obsecurity as a bonus)
      result.verification_token = faker.random.words(4)
      console.log('!'.blue)
      console.log('!'.blue, 'Configuration complete!')
      console.log('!'.blue)
      console.log('!'.blue, `Your verification token is: "${result.verification_token.bold}"`)
      console.log('!'.blue, 'This token is used to protect you from remote forgery - If you open this vault and see a different')
      console.log('!'.blue, 'token, then the remote server is a fraud!')
      mkdirp(REPASS_DIR, () => {
        fs.writeFileSync(REPASS_DIR + path.sep + '.gitignore', 'config.json')
        fs.writeFile(CONFIG_PATH, JSON.stringify(result, null, 4), (err) => {
          if (err) throw err
          fs.chmodSync(CONFIG_PATH, 600)
        })
        fs.chmodSync(REPASS_DIR, 700)
      })
    })
  })
} else {
  const action = argv._.shift()
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
      // Windows doesn't support 700, 600
      if (os.type() !== 'Windows_NT') {
        cliError(`Insecure permissions in ${REPASS_DIR}`)
      }
    }
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH))
      if (typeof config !== 'object') cliError(`Invalid config file: ${CONFIG_PATH}`)
    } catch (e) {
      throw e
    }
  }
  config.vaults = config.vaults || []

  if (action === 'ls') {
    if (config.vaults.length < 1) {
      cliError('No vaults available, use `repass setup`, `repass use` or `repass set`\n')
    } else {
      process.stdout.write(`Vaults: \n${config.vaults.join('\n\t')}\n`)
    }
  // Repass `use` selects a vault for use
  // `repass use existingDB` (swap to existingDB)
  } else if (action === 'use') {
    if (argv._.length === 0) {
      cliError('Usage: `repass use <vault>`\n')
    }
    console.log(config.vaults)
  } else {
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
      repass.Error = cliError
      if (!repass[action]) cliError(`No such action "${action}"`)
      try {
        repass.auth(() => {
          try {
            repass[action](...argv._, (err, data) => {
              if (err) {
                cliError(err.message + '\n')
              }
              console.log(data)
            })
          } catch (e) {
            cliError(`Failure: ${e.message}\n`)
          }
        })
      } catch (e) {
        cliError(`Failure: ${e.message}\n`)
      }
    })
  }
}
