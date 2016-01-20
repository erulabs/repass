'use strict'

import Random from 'random-js'

const RepassOptionsError = function (msg) {
  this.name = 'RepassOptionsError'
  this.message = msg || 'Repass Options incomplete'
}

export class Repass {
  constructor (options) {
    if (options.otp === undefined) {
      throw new RepassOptionsError('Missing options.otp property')
    }
    console.log(options)
  }
  get () {

  }
  set () {

  }
  del () {

  }
  ls () {

  }
  regen () {

  }
  gen (seed) {
    const random = new Random(Random.engines.mt19937().autoSeed())
    console.log(random.string())
  }
}
