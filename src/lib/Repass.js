'use strict'

import Random from 'random-js'
import AWS from 'aws-sdk'

const RepassOptionsError = function (msg) {
  this.name = 'RepassOptionsError'
  this.message = msg || 'Repass Options incomplete'
}

export class Repass {
  constructor (options) {
    this.keyStore = {}
    if (options.otp === undefined) {
      throw new RepassOptionsError('Missing options.otp property')
    }
    console.log(options)
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
