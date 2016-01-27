<p align="center"><img width="126" height="149" src="https://i.imgur.com/9ZmsG2T.png"><br>
<strong>Repass</strong><br>
A password manager that doesn't suck
</p>

[![Build Status](https://img.shields.io/circleci/project/erulabs/repass/master.svg?style=flat-square)](https://circleci.com/gh/erulabs/repass) [![npm version](https://img.shields.io/npm/v/repass.svg?style=flat-square)](https://www.npmjs.com/package/repass) [![Code Climate](https://img.shields.io/codeclimate/github/erulabs/repass.svg?style=flat-square)](https://codeclimate.com/github/erulabs/repass) [![Dependency Status](https://img.shields.io/david/erulabs/repass.svg?style=flat-square)](https://david-dm.org/erulabs/repass) [![devDependency Status](https://img.shields.io/david/dev/erulabs/repass.svg?style=flat-square)](https://david-dm.org/erulabs/repass#info=devDependencies) [![npm downloads](https://img.shields.io/npm/dm/repass.svg?style=flat-square)](https://www.npmjs.com/package/repass) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/erulabs/repass) [![Stories in Ready](https://badge.waffle.io/erulabs/repass.png?label=ready&title=Ready)](https://waffle.io/erulabs/repass)

# Nothing to see here just yet :)

## Getting started:

`npm install -g repass`

`repass setup`

#### List secrets
`repass ls`

#### Regenerate secrets
`repass regen [site] [--all]`

#### Get / set secrets for a given variable:
`repass get <name>`
`repass set <name>`

#### Generate secrets
`repass gen <name>`

#### Generate human readable secrets (good for mobile use):
`repass gen <name> --human`

#### Generate secrets for dumb sites (eg: 8-20 at least one yadda yadda yadda):
`repass gen <name> --dumb`
