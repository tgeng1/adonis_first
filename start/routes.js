'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

const Util = require('@Lib/Util')

Route.group(() => {
  try {
    Route.get('test', 'TestController.testConsole')
    Route.get('hello-world', 'TestController.helloWorld')
    Route.get('get-books', 'books/BooksController.getUsers')
  } catch(err) {
    return Util.end2front({
      msg: '服务端无此路由',
      code: 9999,
    })
  }
}).prefix('api/qxs')

// Route.on('/').render('welcome')

//兜底：如果都匹配不到路由，则转到404页面
//Route.any('*', ({ view }) => view.render('error.404'))
Route.any('*', () => {
  return Util.end2front({
    msg: '服务端无此路由',
    code: 9999,
  })
})
