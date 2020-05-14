'use strict'

const Database = use('Database')
const Util = require('@Lib/Util')

class BooksService {
  async getUsers(ctx) {

    const { request } = ctx
    const result = await Database.table('books').select('*')
    let data = result
    if (result) {
      return Util.end2front({data})
    }
  }
}
module.exports = BooksService
