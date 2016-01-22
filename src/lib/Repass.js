'use strict'

import Random from 'random-js'
import AWS from 'aws-sdk'
import yub from 'yub'

const RepassOptionsError = function (msg) {
  this.name = 'RepassOptionsError'
  this.message = msg || 'Repass Options incomplete'
}

export class Repass {
  constructor (options = {}) {
    this.otp = false // Bool - is authed via OTP yet or not
    this.options = options
    if (options.otp === undefined) {
      throw new RepassOptionsError('Missing options.otp property')
    }
  }
  // Auth via yubico
  auth (options = this.options, callback = function () {}) {
    if (options.yubicoClientId && options.yubicoSecretKey && options.otp) {
      yub.init(options.yubicoClientId, options.yubicoSecretKey)
      yub.verify(options.otp, (err, data) => {
        if (data.valid && !err) {
          callback(data)
        } else {
          throw new RepassOptionsError('OTP signature invalid!')
        }
      })
    } else {
      throw new RepassOptionsError('Only Yubikey OTP supported at this time')
    }
    return this
  }
  save () {

  }
  load () {

  }
  get (key) {

  }
  set (key, value = false) {
    if (!value) value = this.gen()
  }
  del (key = false) {

  }
  ls () {

  }
  regen () {

  }
  gen () {
    const random = new Random(Random.engines.mt19937().autoSeed())
    console.log(random.string())
  }
}
