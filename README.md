# locus68
[![Build Status](https://travis-ci.org/TheOrangeOne/locus68.svg?branch=master)](https://travis-ci.org/TheOrangeOne/locus68)
> third time's a charm

## building/running

### prerequisites
- ensure `$GOPATH` is set
- [`dep`](https://golang.github.io/dep/docs/installation.html)

`dep` can be installed via `go get -u github.com/golang/dep/cmd/dep`

then,

- clone to `$GOPATH/src/github.com/TheOrangeOne/locus68`
- install dependencies: `dep ensure`
- install: `go install`
- to run: `locus68`

### heroku
Install the [heroku-cli](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

On mac this can be done via `brew install heroku/brew/heroku`

then,

- simply: `heroku local`

## commandline args
- `--host <host>`
- `--port <port>`

Note that the environment variables `HOST` and `PORT` can be specified as well.

## testing

### javascript

to test the frontend code run, use [mocha](https://mochajs.org/):

```sh
$ mocha --watch static/test
```
