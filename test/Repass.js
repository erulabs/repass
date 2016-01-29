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
  it('should have the proper methods', () => {
    expect(repass.get).toBeA('function')
    expect(repass.auth).toBeA('function')
    expect(repass.save).toBeA('function')
    expect(repass.saveViaAWS).toBeA('function')
    expect(repass.saveViaFile).toBeA('function')
    expect(repass.load).toBeA('function')
    expect(repass.loadViaAWS).toBeA('function')
    expect(repass.loadViaFile).toBeA('function')
    expect(repass.encrypt).toBeA('function')
    expect(repass.decrypt).toBeA('function')
    expect(repass.set).toBeA('function')
    expect(repass.ls).toBeA('function')
    expect(repass.regen).toBeA('function')
    expect(repass.gen).toBeA('function')
  })
})
