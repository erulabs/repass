'use strict'

// In seconds, the amount of time to remember authentication
const DEFAULT_AUTH_EXPIRE_TIME = 120
const DEFAULT_ENCRYPTION_SCHEME = 'aes-256-cbc'
const DEFAULT_HASHING_SCHEME = 'sha256'
const DEFAULT_STR_FORMAT = 'utf-8'

const Random = require('random-js')
// const aws = require('aws-sdk')
const fs = require('fs')
// const path = require('path')
const crypto = require('crypto')

export class Repass {
  constructor (options = {}) {
    this.options = options
    this.options.verbosity = this.options.verbosity || 1
    this.options.encryptionScheme = this.options.encryptionScheme || DEFAULT_ENCRYPTION_SCHEME
    this.options.hashingScheme = this.options.hashingScheme || DEFAULT_HASHING_SCHEME
    this.options.strFormat = this.options.strFormat || DEFAULT_STR_FORMAT
  }
  auth (callback = function () {}) {
    const options = this.options
    if (options.yubicoClientId && options.yubicoSecretKey && options.otp) {
      return this.authViaYubikey(callback)
    } else throw new Error('auth: Only Yubikey OTP supported at this time - Try defining Yubico API details')
  }
  authViaYubikey (callback = function () {}) {
    // Make sure yub library is reaped at the end of this call
    const yub = require('yub')
    const options = this.options
    yub.init(options.yubicoClientId, options.yubicoSecretKey)
    yub.verify(options.otp, (err, data) => {
      if (data.valid && !err) {
        this.otpToken = data.otp
        this.otpIdentity = data.identity
        this.expireAuth('after', 120)
        callback(data)
      } else throw new Error('authViaYubikey: OTP signature invalid!')
    })
  }
  // Expires authentication details after seconds
  expireAuth (afterOrEvery, seconds) {
    if (typeof afterOrEvery === 'number') {
      seconds = afterOrEvery
      afterOrEvery = undefined
    }
    if (!afterOrEvery) afterOrEvery = 'after'
    if (!seconds) seconds = DEFAULT_AUTH_EXPIRE_TIME
    const doExpireAuth = () => {
      this.otpToken = this.otpIdentity = this.passphrase = undefined
    }
    if (afterOrEvery === 'after') setTimeout(doExpireAuth, seconds * 1000)
    else setInterval(doExpireAuth, seconds * 1000)
  }
  encrypt (SENSITIVE_DATA_OBJECT) {
    if (!this.otpToken || !this.otpIdentity || !this.options.passphrase) {
      throw new Error('encrypt: Missing otpToken, otpIdentity or passphrase')
    }
    if (!SENSITIVE_DATA_OBJECT || typeof SENSITIVE_DATA_OBJECT !== 'object') {
      throw new Error('encrypt: Refusing to encrypt invalid data')
    }
    try {
      const data = new Buffer(JSON.stringify(SENSITIVE_DATA_OBJECT), 'binary')
      const cipher = crypto.createCipher(this.options.encryptionScheme,
        crypto.createHash(this.options.hashingScheme).update(this.otpToken + this.options.passphrase + this.otpIdentity, this.options.strFormat).digest('hex')
      )
      let ENCRYPTED_DATA_STRING = cipher.update(data, this.options.strFormat, 'hex')
      ENCRYPTED_DATA_STRING += cipher.final('hex')
      return ENCRYPTED_DATA_STRING
    } catch (e) {
      throw new Error('Encryption failed! ' + e.message)
    }
  }
  decrypt (ENCRYPTED_DATA_STRING) {
    if (!ENCRYPTED_DATA_STRING) return {}
    if (!this.otpToken || !this.otpIdentity || !this.options.passphrase) {
      throw new Error('decrypt: Missing otpToken, otpIdentity or passphrase')
    }
    const buf = new Buffer(ENCRYPTED_DATA_STRING, 'base64')
    try {
      const decipher = crypto.createDecipheriv(this.options.encryptionScheme, this.otpToken + this.options.passphrase + this.otpIdentity, buf.toString('binary', 0, 16))
      decipher.setAutoPadding(false)
      let dec = decipher.update(buf.toString('base64', 16), 'base64', this.options.strFormat)
      dec += decipher.final(this.options.strFormat)
      const SENSITIVE_DATA_OBJECT = JSON.parse(dec)
      return SENSITIVE_DATA_OBJECT
    } catch (e) {
      console.log('Failed to decrypt')
    }
  }
  save (ENCRYPTED_DATA_STRING) {
    const options = this.options
    if (!ENCRYPTED_DATA_STRING || typeof ENCRYPTED_DATA_STRING !== 'string') throw new Error('save: Refusing to save invalid data')
    if (options.db) this.saveViaFile(ENCRYPTED_DATA_STRING)
    if (options.bucket && options.awsId && options.awsSecret) this.saveViaAWS(ENCRYPTED_DATA_STRING)
  }
  saveViaAWS (ENCRYPTED_DATA_STRING) {
    throw new Error('saveViaAWS: Unimplemented')
  }
  saveViaFile (ENCRYPTED_DATA_STRING, callback = function () {}) {
    const options = this.options
    fs.writeFile(options.db, ENCRYPTED_DATA_STRING, (err) => {
      if (err) throw new Error(err)
      else callback()
    })
  }
  load (callback = function () {}) {
    const options = this.options
    if (options.db) this.loadViaFile(callback)
    if (options.bucket && options.awsId && options.awsSecret) this.loadViaAWS(callback)
  }
  loadViaAWS (callback = function () {}) {
    throw new Error('saveViaAWS: Unimplemented')
  }
  loadViaFile (callback = function () {}) {
    const options = this.options
    fs.exists(options.db, (exists) => {
      if (exists) {
        fs.readFile(options.db, (err, data) => {
          if (err) throw new Error(err)
          else callback(data)
        })
      } else callback()
    })
  }
  //
  // EXPOSED ACTIONS
  //
  get (args, callback = function () {}) {
    if (typeof args === 'string') args = [args]
    if (args.length === 0) throw new Error(`get: requires at least one argument`)
    const key = args.shift()
    this.load((ENCRYPTED_DATA_STRING) => {
      const SENSITIVE_DATA_OBJECT = this.decrypt(ENCRYPTED_DATA_STRING)
      if (SENSITIVE_DATA_OBJECT &&
          SENSITIVE_DATA_OBJECT[key]) callback(SENSITIVE_DATA_OBJECT[key])
      else callback()
    })
  }
  set (args, callback = function () {}) {
    if (typeof args === 'string') args = [args]
    if (args.length === 0) throw new Error(`set: requires at least one argument`)
    const key = args.shift()
    // TODO: Interpret key=value rest of args
    let value
    if (args.length !== 0) value = args.shift()
    this.load((ENCRYPTED_DATA_STRING) => {
      const SENSITIVE_DATA_OBJECT = this.decrypt(ENCRYPTED_DATA_STRING)
      SENSITIVE_DATA_OBJECT[key] = value
      this.save(this.encrypt(SENSITIVE_DATA_OBJECT))
      callback('Save Complete')
    })
  }
  use (args, callback = function () {}) {

  }
  ls (args, callback = function () {}) {
    throw new Error('saveViaAWS: Unimplemented')
  }
  regen (args, callback = function () {}) {
    throw new Error('saveViaAWS: Unimplemented')
  }
  gen (args, callback = function () {}) {
    const random = new Random(Random.engines.mt19937().autoSeed())
    callback(random.string())
  }
}
