'use strict'

const Database = use('Database')
class TestController {
  async testConsole() {
    console.log('-------->test');
  }

  async helloWorld(body) {
    const { view } = body
    console.log('---------body---->', body)
    return view.render('hello-world')
  }

  async getUsers(body) {
    const { request } = body
    const result = await Database.table('user').select('*')
    console.log('----request--->', request.get())
    console.log('----result-->', result)
  }

  async addUsers(body) {
    const { request } = body
  }
}

module.exports = TestController
