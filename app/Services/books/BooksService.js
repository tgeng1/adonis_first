'use strict'

const Database = use('Database')
const Util = require('@Lib/Util')

class BooksService {
  async getUsers(ctx) {
    const { pageNo, pageSize } = ctx.request.all()
    const result = await Database
      .from('books')
      .select('*')
      .where('_id', '>', (pageNo - 1) * pageSize)
      .limit(pageSize)
      .orderBy('_id', 'desc')
    const count = await Database
      .from('books')
      .getCount()
      let data = { result, count }
    if (result && count) {
      return Util.end2front({data})
    }
  }
}
module.exports = BooksService
