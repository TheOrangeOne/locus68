# locus68
> third time's a charm

## building/running
- from root directory (above `src/`), run `export GOPATH=$PWD`
- first time: `go get locus68`
- every time: `go build locus68`
- to run: `./locus68`

## commandline args
- `--addr host:port` to specify host and port

## testing

### javascript

to test the frontend code run, use [mocha](https://mochajs.org/):

```sh
$ mocha --watch static/test
```
