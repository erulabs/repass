# Repass [![Build Status](https://img.shields.io/circleci/project/erulabs/repass/master.svg?style=flat-square)](https://circleci.com/gh/erulabs/repass) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/erulabs/repass)

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
