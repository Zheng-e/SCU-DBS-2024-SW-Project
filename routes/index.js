'use strict';
const app = require('../WebApp');
const lm = require('./libmanagement');

//数据库初始化
app.route('/init','post',lm.init);
app.route('/addNewBook','post',lm.addNewBook);
app.route('/addBookCount','post',lm.addBookCount);
app.route('/deleteBook','post',lm.deleteBook);
app.route('/modifyBook','post',lm.modifyBook);
app.route('/searchBook','post',lm.searchBook);
app.route('/addReader','post',lm.addReader);
app.route('/deleteReader','post',lm.deleteReader);
app.route('/modifyReader','post',lm.modifyReader);
app.route('/searchReader','post',lm.searchReader);
app.route('/viewReaderBooks','post',lm.viewReaderBooks);
app.route('/borrowBook','post',lm.borrowBook);
app.route('/returnBook','post',lm.returnBook);
app.route('/overdueReaders','post',lm.overdueReaders);