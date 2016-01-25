'use strict'

const Random = require('random-js')
const aws = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const encryptionScheme = 'aes-256-cbc'

const RepassOptionsError = function (msg) {
  this.name = 'RepassOptionsError'; this.message = msg || 'Repass Options incomplete'
}

export class Repass {
  constructor (options = {}) {
    this.options = options
    this.options.verbosity = this.options.verbosity || 1
    if (options.otp === undefined) throw new RepassOptionsError('constructor: Missing options.otp property')
    if (options.passphrase === undefined) throw new RepassOptionsError('constructor: Missing options.passphrase property')
    if (typeof options.otp !== 'string' || typeof options.passphrase !== 'string') throw new RepassOptionsError('save: Invalid otp or passphrase')
  }
  auth (callback) {
    const options = this.options
    if (options.yubicoClientId && options.yubicoSecretKey && options.otp) {
      return this.authViaYubikey(callback)
    } else throw new RepassOptionsError('auth: Only Yubikey OTP supported at this time')
  }
  authViaYubikey (callback) {
    const yub = require('yub')
    const options = this.options
    yub.init(options.yubicoClientId, options.yubicoSecretKey)
    yub.verify(options.otp, (err, data) => {
      if (data.valid && !err) {
        this.otpToken = data.otp
        this.otpIdentity = data.identity
        if (callback) callback(data)
      } else throw new RepassOptionsError('authViaYubikey: OTP signature invalid!')
    })
  }
  encrypt (SENSITIVE_DATA_OBJECT, callback) {
    if (!this.otpToken || !this.otpIdentity || !this.options.passphrase) {
      throw new RepassOptionsError('encrypt: Missing otpToken, otpIdentity or passphrase')
    }
    if (!SENSITIVE_DATA_OBJECT || typeof SENSITIVE_DATA_OBJECT !== 'object') throw new RepassOptionsError('encrypt: Refusing to encrypt invalid data')
    const data = new Buffer(JSON.stringify(SENSITIVE_DATA_OBJECT), 'binary')
    const cipher = crypto.createCipher(
      'aes-256-cbc',
      crypto.createHash('sha256').update(this.otpToken + this.options.passphrase + this.otpIdentity, 'utf-8').digest('hex')
    )
    let ENCRYPTED_DATA_STRING = cipher.update(data, 'utf-8', 'hex')
    ENCRYPTED_DATA_STRING += cipher.final('hex')
    return ENCRYPTED_DATA_STRING
  }
  decrypt (ENCRYPTED_DATA_STRING, callback) {
    if (!this.otpToken || !this.otpIdentity || !this.options.passphrase) {
      throw new RepassOptionsError('decrypt: Missing otpToken, otpIdentity or passphrase')
    }
    if (!ENCRYPTED_DATA_STRING || typeof ENCRYPTED_DATA_STRING !== 'string') throw new RepassOptionsError('decrypt: Refusing to decrypt invalid data')
    const buf = new Buffer(ENCRYPTED_DATA_STRING, 'base64')
    const decipher = crypto.createDecipheriv(encryptionScheme, this.otpToken + this.options.passphrase + this.otpIdentity, buf.toString('binary', 0, 16))
    decipher.setAutoPadding(false)
    let dec = decipher.update(buf.toString('base64', 16), 'base64', 'utf-8')
    dec += decipher.final('utf-8')
    const SENSITIVE_DATA_OBJECT = JSON.parse(dec)
    return SENSITIVE_DATA_OBJECT
  }
  save (ENCRYPTED_DATA_STRING) {
    const options = this.options
    if (!ENCRYPTED_DATA_STRING || typeof ENCRYPTED_DATA_STRING !== 'string') throw new RepassOptionsError('save: Refusing to save invalid data')
    if (options.db) this.saveViaFile(ENCRYPTED_DATA_STRING)
    if (options.bucket && options.awsId && options.awsSecret) this.saveViaAWS(ENCRYPTED_DATA_STRING)
  }
  saveViaAWS (ENCRYPTED_DATA_STRING) {
    throw new Error('saveViaAWS: Unimplemented')
  }
  saveViaFile (ENCRYPTED_DATA_STRING) {
    const options = this.options
    fs.writeFile(options.db, ENCRYPTED_DATA_STRING, (err) => {
      if (err) throw new Error(err)
    })
  }
  load (callback) {
    const options = this.options
    if (options.db) this.loadViaFile(callback)
    if (options.bucket && options.awsId && options.awsSecret) this.loadViaAWS(callback)
  }
  loadViaAWS (callback) {
    throw new Error('saveViaAWS: Unimplemented')
  }
  loadViaFile (callback) {
    const options = this.options
    fs.readFile(options.db, (err, data) => {
      if (err) throw new Error(err)
      else callback(data)
    })
  }
  get (key, callback) {
    this.load((ENCRYPTED_DATA_STRING) => {
      const SENSITIVE_DATA_OBJECT = this.decrypt(ENCRYPTED_DATA_STRING)
      if (SENSITIVE_DATA_OBJECT[key]) callback(SENSITIVE_DATA_OBJECT[key])
      else callback(undefined)
    })
  }
  set (key, value = false) {
    this.load((ENCRYPTED_DATA_STRING) => {
      const SENSITIVE_DATA_OBJECT = this.decrypt(ENCRYPTED_DATA_STRING)
      SENSITIVE_DATA_OBJECT[key] = value
      this.encrypt(SENSITIVE_DATA_OBJECT, (ENCRYPTED_DATA_STRING) => {
        this.save(ENCRYPTED_DATA_STRING)
      })
    })
  }
  ls () {
    throw new Error('saveViaAWS: Unimplemented')
  }
  regen () {
    throw new Error('saveViaAWS: Unimplemented')
  }
  gen () {
    const random = new Random(Random.engines.mt19937().autoSeed())
    console.log(random.string())
  }
}
