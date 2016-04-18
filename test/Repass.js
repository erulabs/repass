/* global describe, it */
'use strong'

import expect from 'expect'
import { Repass } from './../src/lib/Repass.js'
// import AWS from 'aws-sdk'

describe('Repass', () => {
  let repass
  it('shouldnt instantiate without options', () => {
    try {
      new Repass() /* eslint no-new: 0 */
    } catch (e) {
      expect(e).toBeAn(Error)
    }
  })
  it('should instantiate with options', () => {
    repass = new Repass({
      otp: 'fake',
      passphrase: 'fake'
    })
    expect(repass).toBeA(Repass)
  })
  // Note: LS is missing from this list, as it is not a lib function but rather a CLI function
  const expectedCommands = [ 'get', 'auth', 'save', 'saveViaAWS', 'saveViaFile', 'load', 'loadViaAWS',
  'loadViaFile', 'encrypt', 'decrypt', 'set', 'regen', 'gen', 'use' ]
  expectedCommands.forEach((cmd) => {
    it(`should have the proper methods - ${cmd}`, () => {
      expect(repass[cmd]).toBeA('function')
    })
  })
})
