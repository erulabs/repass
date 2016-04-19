<p align="center"><img width="126" height="149" src="https://i.imgur.com/9ZmsG2T.png"><br>
<strong>Repass</strong><br>
A password manager that doesn't suck
</p>

[![Build Status](https://img.shields.io/circleci/project/erulabs/repass/master.svg?style=flat-square)](https://circleci.com/gh/erulabs/repass) [![npm version](https://img.shields.io/npm/v/repass.svg?style=flat-square)](https://www.npmjs.com/package/repass) [![Code Climate](https://img.shields.io/codeclimate/github/erulabs/repass.svg?style=flat-square)](https://codeclimate.com/github/erulabs/repass) [![Dependency Status](https://img.shields.io/david/erulabs/repass.svg?style=flat-square)](https://david-dm.org/erulabs/repass) [![devDependency Status](https://img.shields.io/david/dev/erulabs/repass.svg?style=flat-square)](https://david-dm.org/erulabs/repass#info=devDependencies) [![npm downloads](https://img.shields.io/npm/dm/repass.svg?style=flat-square)](https://www.npmjs.com/package/repass) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/erulabs/repass) [![Stories in Ready](https://badge.waffle.io/erulabs/repass.png?label=ready&title=Ready)](https://waffle.io/erulabs/repass)

## Getting started:

`npm install -g repass`

`repass setup`

#### List vaults
`repass ls`
`repass ls VAULT_NAME`

#### Regenerate secrets
`repass regen VAULT_NAME [--all]`

#### Get / set secrets for a given variable:
`repass get VAULT_NAME [item]`
`repass set VAULT_NAME [item]`

#### Generate secrets
`repass gen VAULT_NAME [item]`

#### Generate human readable secrets (good for mobile use):
`repass gen VAULT_NAME --human`

#### Generate secrets for dumb sites (eg: 8-20 at least one yadda yadda yadda):
`repass gen VAULT_NAME --dumb`


### Usage flow:
#### Setting / Getting
`repass new VAULT_NAME` -> Prompts for security/encryption/storage choices (inherit defaults)
`repass set VAULT_NAME ITEM_NAME _data_` -> Adds data to vault after security prompts

`repass set twitter username foo` (Set a simple string - username=foo)
`repass set twitter username` (Prompt for input)
`repass set twitter data 'username: foo, password: bar, foo: baz'` (data stored as JSON)

Get YAML out:
`repass get twitter data` =>
```
username: foo,
password: bar,
foo: baz
```

Formatters:
`repass get twitter data -Fjson` => `{ username: ... }`


#### Uploading:
`repass backup` -> Backs up each database according to its storage options (uses default if none is set)
`repass backup VAULT_NAME`

`repass setup` -> Prompts and sets default options
`repass setup VAULT_NAME` -> sets up per vault options
