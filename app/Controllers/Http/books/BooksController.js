'use strict'

const Database = use('Database')
const BooksService = require('@Services/books/BooksService')
const booksService = new BooksService()
const Util = require('@Lib/Util')

class TestController {
  async getUsers(ctx) {
    const result = await booksService.getUsers(ctx)
    if (result) {
      return result
    }
  }
}

module.exports = TestController
