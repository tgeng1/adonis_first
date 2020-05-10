'use strict'

const path = require('path')
require('node-require-alias').setAlias({
  ['@Table']: path.join(__dirname, '/app/Models/Table'),
  ['@Join']: path.join(__dirname, '/app/Models/Join.js'),
  ['@Models']: path.join(__dirname, '/app/Models'),
  ['@Services']: path.join(__dirname, '/app/Services'),
  ['@Lib']: path.join(__dirname, '/app/Lib'),
  ['@BaseClass']: path.join(__dirname, '/app/BaseClass'),
  ['@Middleware']: path.join(__dirname, '/app/Middleware'),
})

/*
|--------------------------------------------------------------------------
| Http server
|--------------------------------------------------------------------------
|
| This file bootstrap Adonisjs to start the HTTP server. You are free to
| customize the process of booting the http server.
|
| """ Loading ace commands """
|     At times you may want to load ace commands when starting the HTTP server.
|     Same can be done by chaining `loadCommands()` method after
|
| """ Preloading files """
|     Also you can preload files by calling `preLoad('path/to/file')` method.
|     Make sure to pass relative path from the project root.
*/

const { Ignitor } = require('@adonisjs/ignitor')

new Ignitor(require('@adonisjs/fold'))
  .appRoot(__dirname)
  .fireHttpServer()
  .catch(console.error)
