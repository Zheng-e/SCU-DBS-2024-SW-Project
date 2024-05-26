'use strict';
const db = require('../coSqlite3');
exports.init = function*(req,res){
    try{
        yield db.execSQL(
            `create table Book(
                bID varchar(30) primary key,
                bName varchar(30) not null,
                bPub varchar(30),
                bDate date,
                bAuthor varchar(20),
                bMem varchar(30),
                bCnt int check(bCnt>=0) not null,
                bTotalCnt int check(bTotalCnt>=0) not null
            );`
        )
    }
    catch(err){
        yield db.execSQL("DROP TABLE IF EXISTS Book");
        return "<html><body><div id='result' style='display:none'>1</div>错误,创建Book表失败</body></html>";
    }
    try{
        yield db.execSQL(
            `create table Reader(
                rID varchar(8) primary key,
                rName varchar(10) not null,
                rSex varchar(2) check (rSex IN ('男', '女')) not null,
                rDept varchar(10),
                rGrade int check (rGrade > 0)
            );`
        )
    }
    catch(err){
        yield db.execSQL("DROP TABLE IF EXISTS Reader");
        return "<html><body><div id='result' style='display:none'>1</div>错误,创建Reader表失败</body></html>";
    }
    try{
        yield db.execSQL(
            `create table Record(
                bID varchar(30),
                rID varchar(8),
                borrowDate date not null,
                dueDate date not null,
                statue boolean,
                foreign key(bID) references Book(bID),
                foreign key(rID) references Reader(rID)
            );`
        )
    }
    catch(err){
        yield db.execSQL("DROP TABLE IF EXISTS Record");
        return "<html><body><div id='result' style='display:none'>1</div>错误,创建Record表失败</body></html>";
    }
    res.send("<html><body><div id='result' style='display:none'>0</div>成功</body></html>");
    return;
}

function isValidDate(dateString) {
    // 正则表达式验证日期格式 yyyy-mm-dd
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) {
        return false;
    }

    // 验证日期的有效性
    const date = new Date(dateString);
    const timestamp = date.getTime();

    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        return false;
    }

    return dateString === date.toISOString().split('T')[0];
}

exports.addNewBook = function*(req,res){
    let body = req.body;
    const {
        bID = '',
        bName = '',
        bPub = '',
        bDate = '',
        bAuthor = '',
        bMem = '',
        bCnt = ''
    } = body;
    if(!bID || bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求，书号唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    if(!bName || bName.length > 30){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：书名不符合格式要求，最多30个字符，如“人间词话”</body></html>")
    }
    if(bPub && bPub.length > 30){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：书名不符合格式要求，最多30个字符，如“人间词话”</body></html>")
    }
    if(bDate && !isValidDate(bDate)){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版日期不符合格式要求，提交格式为“yyyy-mm-dd”，如“2008-08-09”</body></html>');
        return;
    }
    if (bAuthor && bAuthor.length > 20) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：作者名不符合格式要求，最多20个字符，如“王国维”</body></html>');
        return;
    }
    if (bMem && bMem.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：内容摘要不符合格式要求，最多30个字符，如“高等教育出版社”</body></html>');
        return;
    }
    if (isNaN(bCnt) || bCnt % 1 !== 0 || bCnt <= 0) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：数量应该是正整数,整数，应该>0，表示新书的数量</body></html>');
        return;
    }
    let b=yield db.execSQL("SELECT * FROM book WHERE bID=?",[bID]);
    if(b.length>0){
        res.send('<html><body><div id="result" style="display:none">1</div>图书已经存在</body></html>');
        return;
    }
    yield db.execSQL("INSERT INTO book VALUES(?,?,?,?,?,?,?,?)",[bID,bName,bPub,bDate,bAuthor,bMem,bCnt,bCnt]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    return;
}

exports.addBookCount = function*(req,res){
    const { bID, bCnt } = req.body;
    if (!bID || bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求,书号应唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    if (isNaN(bCnt) || bCnt <= 0 || bCnt % 1 !== 0){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：数量应该是整数，且>0，表示该书增加的数量</body></html>')
        return;
    }
    let r = yield db.execSQL("SELECT * FROM book WHERE bID=?",[bID]);
    if (r.length == 0){
        res.send('<html><body><div id="result" style="display:none">1</div>该书籍不存在</body></html>')
        return;
    }
    let bTotalCnt = r[0].bTotalCnt;
    let bCnt1 = r[0].bCnt;
    yield db.execSQL("update book set bCnt=?, bTotalCnt=? where bID=?", [bCnt1 + parseInt(bCnt), bTotalCnt + parseInt(bCnt), bID]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    const books = yield db.execSQL('SELECT * FROM book WHERE bID = ?', [bID]);
    console.log("更新后", books);
    return;
}

exports.deleteBook = function*(req,res){
    let body = req.body;
    const {
        bID = '',
        bCnt = ''
    } = body;
    if (!bID || bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">3</div>提交的参数有误：书号不符合格式要求,书号唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    if (isNaN(bCnt) || bCnt <= 0 || bCnt % 1 !== 0) {
        res.send('<html><body><div id="result" style="display:none">3</div>提交的参数有误：数量应该是整数，且>0，表示该书减少的数量</body></html>');
        return;
    }
    let r=yield db.execSQL("SELECT * FROM book WHERE bID=?",[bID]);
    if (r.length == 0){
        res.send('<html><body><div id="result" style="display:none">1</div>该书不存在</body></html>');
            return;
    }
    let bCnt1 = r[0].bCnt;
    let bTotalCnt = r[0].bTotalCnt;
    if(bCnt > bCnt1){
        res.send('<html><body><div id="result" style="display:none">2</div>减少的数量大于该书目前在库数量</body></html>')
        return;
    }else if(bCnt == bCnt1){
        yield db.execSQL("DELETE FROM book WHERE bID=?",[bID]);
        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
        const books = yield db.execSQL('SELECT * FROM book WHERE bID = ?', [bID]);
        console.log("更新后", books);
        return;
    }else{
        yield db.execSQL("update book set bCnt=?,bTotalCnt=? where bID=? ",[bCnt1 - parseInt(bCnt),bTotalCnt - parseInt(bCnt),bID]);
        res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
        const books = yield db.execSQL('SELECT * FROM book WHERE bID = ?', [bID]);
        console.log("更新后", books);
        return;
    }
}

exports.modifyBook = function*(req,res){
    let body = req.body;
    const {
        bID = '',
        bName = '',
        bPub = '',
        bDate = '',
        bAuthor = '',
        bMem = ''
    } = body;
    if (!bID || bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求，书号唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    if (!bName || bName.length > 30){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：书名不符合格式要求，最多30个字符，如“人间词话”</body></html>")
    }
    if (bPub && bPub.length > 30){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：书名不符合格式要求，最多30个字符，如“人间词话”</body></html>")
    }
    if (bDate && !isValidDate(bDate)){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版日期不符合格式要求，提交格式为“yyyy-mm-dd”，如“2008-08-09”</body></html>');
        return;
    }
    if (bAuthor && bAuthor.length > 20) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：作者名不符合格式要求，最多20个字符，如“王国维”</body></html>');
        return;
    }
    if (bMem && bMem.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：内容摘要不符合格式要求，最多30个字符，如“高等教育出版社”</body></html>');
        return;
    }
    let r=yield db.execSQL("SELECT * FROM book WHERE bID=?",[bID]);
    if (r.length==0){
        res.send('<html><body><div id="result" style="display:none">1</div>该书不存在</body></html>');
        return;
    }
    const currentBook = r[0];
    const finalName = bName || currentBook.bName;
    const finalPub = bPub || currentBook.bPub;
    const finalDate = bDate || currentBook.bDate;
    const finalAuthor = bAuthor || currentBook.bAuthor;
    const finalMem = bMem || currentBook.bMem;
    yield db.execSQL("update book set bName=?,bPub=?,bDate=?,bAuthor=?,bMem=? where bID=? ",[finalName,finalPub,finalDate,finalAuthor,finalMem,bID]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');

    //TEST
    const books = yield db.execSQL('SELECT * FROM book WHERE bID = ?', [bID]);
    console.log("更新后", books);

    return;
}

exports.searchBook = function*(req,res){
    let body = req.body;
    const {
        bID = '',
        bName = '',
        bPub = '',
        bDate0 = '',
        bDate1 = '',
        bAuthor = '',
        bMem = ''
    } = body;
    if (bID && bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求，书号唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    if (bName && bName.length > 30){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：书名不符合格式要求，最多30个字符，如“人间词话”</body></html>")
    }
    if (bPub && bPub.length > 30){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：书名不符合格式要求，最多30个字符，如“人间词话”</body></html>")
    }
    if (bDate0 && !isValidDate(bDate0)){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版日期不符合格式要求，提交格式为“yyyy-mm-dd”，如“2008-08-09”</body></html>');
        return;
    }
    if (bDate1 && !isValidDate(bDate1)){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：出版日期不符合格式要求，提交格式为“yyyy-mm-dd”，如“2008-08-09”</body></html>');
        return;
    }
    if (bAuthor && bAuthor.length > 20) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：作者名不符合格式要求，最多20个字符，如“王国维”</body></html>');
        return;
    }
    if (bMem && bMem.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：内容摘要不符合格式要求，最多30个字符，如“高等教育出版社”</body></html>');
        return;
    }
    let sql = "SELECT * FROM book WHERE 1=1";
    let params = [];

    if (bID) {
        sql += " AND bID LIKE ?";
        params.push('%' + bID + '%');
    }
    if (bName) {
        sql += " AND bName LIKE ?";
        params.push('%' + bName + '%');
    }
    if (bPub) {
        sql += " AND bPub LIKE ?";
        params.push('%' + bPub + '%');
    }
    if (bDate0) {
        sql += " AND bDate >= ?";
        params.push(bDate0);
    }
    if (bDate1) {
        sql += " AND bDate <= ?";
        params.push(bDate1);
    }
    if (bAuthor) {
        sql += " AND bAuthor LIKE ?";
        params.push('%' + bAuthor + '%');
    }
    if (bMem) {
        sql += " AND bMem LIKE ?";
        params.push('%' + bMem + '%');
    }
    let results = yield db.execSQL(sql, params);
    let html = "<html><head><META HTTP-EQUIV='Content-Type' Content='text-html;charset=utf-8'></head><body>";
    html += "<table border=1 id='result'>";
    if (results.length > 0) {
        results.forEach(row => {
            html += "<tr>";
            html += `<td>${row.bID}</td>`;
            html += `<td>${row.bName}</td>`;
            html += `<td>${row.bTotalCnt}</td>`;
            html += `<td>${row.bCnt}</td>`;
            html += `<td>${row.bPub}</td>`;
            html += `<td>${new Date(row.bDate).toISOString().split('T')[0]}</td>`;
            html += `<td>${row.bAuthor}</td>`;
            html += `<td>${row.bMem}</td>`;
            html += "</tr>";
        });
    }
    html += "</table></body></html>";
    res.send(html);
}

exports.addReader = function*(req,res){
    let body = req.body;
    const {
        rID = '',
        rName = '',
        rSex = '',
        rDept = '',
        rGrade = ''
    } = body;
    if(!rID || rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    if(!rName || rName.length > 10){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：姓名不符合格式要求，最多10个字，如“张三”</body></html>")
    }
    if(!rSex || !['男', '女'].includes(rSex)){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：性别不符合格式要求，应该填写“男”或者“女””</body></html>")
    }
    if(rDept && rDept > 10){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：系名不符合格式要求，最多10个字，如“计科系”，如“2008-08-09”</body></html>');
        return;
    }
    if (rGrade && (isNaN(rGrade) || rGrade % 1 !== 0 || rGrade <= 0)) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：年级应该是正整数</body></html>');
        return;
    }
    let r=yield db.execSQL("SELECT * FROM Reader WHERE rID=?",[rID]);
    if(r.length>0){
        res.send('<html><body><div id="result" style="display:none">1</div>该证号已经存在</body></html>');

        //TEST
        const reader = yield db.execSQL('SELECT * FROM Reader');
        console.log("更新后", reader);

        return;
    }
    yield db.execSQL("INSERT INTO Reader VALUES(?,?,?,?,?)",[rID,rName,rSex,rDept,rGrade]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');

    //TEST
    const reader = yield db.execSQL('SELECT * FROM Reader');
    console.log("更新后", reader);

    return;
}

exports.deleteReader = function*(req,res){
    let body = req.body;
    const {
        rID = ''
    } = body;
    if (!rID || rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">3</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    let r = yield db.execSQL("SELECT * FROM Reader WHERE rID=?",[rID]);
    if (r.length == 0){
        res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
    }
    const re = yield db.execSQL('SELECT * FROM Record WHERE rID = ? AND (statue = false)', [rID]);
    if (re.length > 0) {
            res.send('<html><body><div id="result" style="display:none">2</div>该读者尚有书籍未归还</body></html>');
            return;
    }
    yield db.execSQL('DELETE FROM record WHERE rID = ?', [rID]);
    yield db.execSQL('DELETE FROM reader WHERE rID = ?', [rID]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');

    //TEST
    const reader = yield db.execSQL('SELECT * FROM Reader');
    console.log("更新后", reader);
    return;
}

exports.modifyReader = function*(req,res){
    let body = req.body;
    const {
        rID = '',
        rName = '',
        rSex = '',
        rDept = '',
        rGrade = ''
    } = body;
    if(!rID || rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    if(rName && rName.length > 10){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：姓名不符合格式要求，最多10个字，如“张三”</body></html>")
    }
    if(rSex && !['男', '女'].includes(rSex)){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：性别不符合格式要求，应该填写“男”或者“女””</body></html>")
    }
    if(rDept && rDept > 10){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：系名不符合格式要求，最多10个字，如“计科系”，如“2008-08-09”</body></html>');
        return;
    }
    if (rGrade && (isNaN(rGrade) || rGrade % 1 !== 0 || rGrade <= 0)) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：年级应该是正整数</body></html>');
        return;
    }
    let r = yield db.execSQL("SELECT * FROM Reader WHERE rID=?",[rID]);
    if (r.length == 0){
        res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
            return;
    }
    const currentReader = r[0];
    const finalName = rName || currentReader.rName;
    const finalSex = rSex || currentReader.rSex;
    const finalDept = rDept || currentReader.rDept;
    const finalGrade = rGrade || currentReader.rGrade;
    yield db.execSQL("update Reader set rName=?,rSex=?,rDept=?,rGrade=? where rID=? ",[finalName,finalSex,finalDept,finalGrade,rID]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');

    //TEST
    const reader = yield db.execSQL('SELECT * FROM Reader');
    console.log("更新后", reader);
    return;
}

exports.searchReader = function*(req,res){
    let body = req.body;
    const {
        rID = '',
        rName = '',
        rSex = '',
        rDept = '',
        rGrade0 = '',
        rGrade1 = ''
    } = body;
    if(rID && rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    if(rName && rName.length > 10){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：姓名不符合格式要求，最多10个字，如“张三”</body></html>")
    }
    if(rSex && !['男', '女'].includes(rSex)){
        res.send("<html><body><div id='result' style='display:none'>2</div>提交的参数有误：性别不符合格式要求，应该填写“男”或者“女””</body></html>")
    }
    if(rDept && rDept > 10){
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：系名不符合格式要求，最多10个字，如“计科系”，如“2008-08-09”</body></html>');
        return;
    }
    if (rGrade0 && (isNaN(rGrade0) || rGrade0 % 1 !== 0 || rGrade0 <= 0)) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：年级应该是正整数</body></html>');
        return;
    }
    if (rGrade1 && (isNaN(rGrade1) || rGrade1 % 1 !== 0 || rGrade1 <= 0)) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：年级应该是正整数</body></html>');
        return;
    }
    let sql = "SELECT * FROM Reader WHERE 1=1";
    let params = [];

    if (rID) {
        sql += " AND rID LIKE ?";
        params.push('%' + rID + '%');
    }
    if (rName) {
        sql += " AND rName LIKE ?";
        params.push('%' + rName + '%');
    }
    if (rSex) {
        sql += " AND rSex = ?";
        params.push(rSex);
    }
    if (rDept) {
        sql += " AND rDept LIKE ?";
        params.push('%' + rDept + '%');
    }
    if (rGrade0) {
        sql += " AND rGrade >= ?";
        params.push(rGrade0);
    }
    if (rGrade1) {
        sql += " AND rGrade <= ?";
        params.push(rGrade1);
    }
    let results = yield db.execSQL(sql, params);
    let html = "<html><head><META HTTP-EQUIV='Content-Type' Content='text-html;charset=utf-8'></head><body>";
    html += "<table border=1 id='result'>";
    if (results.length > 0) {
        results.forEach(row => {
            html += "<tr>";
            html += `<td>${row.rID}</td>`;
            html += `<td>${row.rName}</td>`;
            html += `<td>${row.rSex}</td>`;
            html += `<td>${row.rDept}</td>`;
            html += `<td>${row.rGrade}</td>`;
            html += "</tr>";
        });
    }
    html += "</table></body></html>";
    res.send(html);
};

exports.viewReaderBooks = function* (req, res) {
    const { rID } = req.body;
    if (!rID || rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    let reader = yield db.execSQL("SELECT * FROM Reader WHERE rID=?", [rID]);
    if (reader.length == 0) {
        res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
        return;
    }
    let books = yield db.execSQL("SELECT b.bID, b.bName, r.borrowDate, r.dueDate, r.statue FROM Record r JOIN Book b ON r.bID = b.bID WHERE r.rID = ? AND r.statue = 0", [rID]);
    let html = "<html><head><META HTTP-EQUIV='Content-Type' Content='text-html;charset=utf-8'></head><body>";
    html += "<table border=1 id='result'>";
    if (books.length > 0) {
        books.forEach(row => {
            let borrowDate = new Date(row.borrowDate);
            let dueDate = new Date(row.dueDate);
            var statue = row.statue;
            if (statue == false){
                var isOverdue = '否';
            }else{
                var isOverdue = '是';
            }

            html += "<tr>";
            html += `<td>${row.bID}</td>`;
            html += `<td>${row.bName}</td>`;
            html += `<td>${borrowDate.toISOString().split('T')[0]}</td>`;
            html += `<td>${dueDate.toISOString().split('T')[0]}</td>`;
            html += `<td>${isOverdue}</td>`;
            html += "</tr>";
        });
    }
    html += "</table></body></html>";
    res.send(html);
};

exports.borrowBook = function* (req, res) {
    const { rID, bID } = req.body;
    if (!rID || rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">1</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    if (!bID || bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求，书号唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    let reader = yield db.execSQL("SELECT * FROM Reader WHERE rID=?", [rID]);
    if (reader.length == 0) {
        res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
        return;
    }
    let book = yield db.execSQL("SELECT * FROM Book WHERE bID=?", [bID]);
    if (book.length == 0) {
        res.send('<html><body><div id="result" style="display:none">2</div>该书号不存在</body></html>');
        return;
    }
    let overdueBooks = yield db.execSQL("SELECT * FROM Record WHERE rID=? AND statue=0 AND (julianday('now') - julianday(borrowDate)) > 60", [rID]);
    if (overdueBooks.length > 0) {
        res.send('<html><body><div id="result" style="display:none">3</div>该读者有超期书未还</body></html>');
        return;
    }
    let borrowedBook = yield db.execSQL("SELECT * FROM Record WHERE rID=? AND bID=? AND statue=0", [rID, bID]);
    if (borrowedBook.length > 0) {
        res.send('<html><body><div id="result" style="display:none">4</div>该读者已经借阅该书，且未归还</body></html>');
        return;
    }
    if (book[0].bCnt <= 0) {
        res.send('<html><body><div id="result" style="display:none">5</div>该书已经全部借出</body></html>');
        return;
    }
    const borrowDate = new Date().toISOString().split('T')[0]; 
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 60); 
    const formattedDueDate = dueDate.toISOString().split('T')[0];

    yield db.execSQL("INSERT INTO Record (rID, bID, borrowDate, dueDate, statue) VALUES (?, ?, ?, ?, 0)", [rID, bID, borrowDate, formattedDueDate]);
    yield db.execSQL("UPDATE Book SET bCnt=bCnt-1 WHERE bID=?", [bID]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    console.log(`读者 ${rID} 借阅了书籍 ${bID}，借书日期：${borrowDate}，应还日期：${formattedDueDate}`);
};

exports.returnBook = function* (req, res) {
    const { rID, bID } = req.body;
    if (!rID || rID.length > 8) {
        res.send('<html><body><div id="result" style="display:none">1</div>提交的参数有误：证号不符合格式要求，唯一标识每个读者,最多8个字符,如“A-31”</body></html>');
        return;
    }
    if (!bID || bID.length > 30) {
        res.send('<html><body><div id="result" style="display:none">2</div>提交的参数有误：书号不符合格式要求，书号唯一标识每种书,最多30个字符,如“ISBN 7-5325-2480-9”</body></html>');
        return;
    }
    let reader = yield db.execSQL("SELECT * FROM Reader WHERE rID=?", [rID]);
    if (reader.length == 0) {
        res.send('<html><body><div id="result" style="display:none">1</div>该证号不存在</body></html>');
        return;
    }
    let book = yield db.execSQL("SELECT * FROM Book WHERE bID=?", [bID]);
    if (book.length == 0) {
        res.send('<html><body><div id="result" style="display:none">2</div>该书号不存在</body></html>');
        return;
    }
    let borrowedBook = yield db.execSQL("SELECT * FROM Record WHERE rID=? AND bID=? AND statue=0", [rID, bID]);
    if (borrowedBook.length == 0) {
        res.send('<html><body><div id="result" style="display:none">3</div>该读者并未借阅该书</body></html>');
        return;
    }
    yield db.execSQL("UPDATE Record SET statue=1 WHERE rID=? AND bID=?", [rID, bID]);
    yield db.execSQL("UPDATE Book SET bCnt=bCnt+1 WHERE bID=?", [bID]);
    res.send('<html><body><div id="result" style="display:none">0</div>成功</body></html>');
    console.log(`读者 ${rID} 归还了书籍 ${bID}`);
};

exports.overdueReaders = function* (req, res) {
    let overdueReaders = yield db.execSQL(`
        SELECT DISTINCT r.rID, r.rName, r.rSex, r.rDept, r.rGrade
        FROM Record rec
        JOIN Reader r ON rec.rID = r.rID
        WHERE rec.statue = 0
        AND (julianday('now') - julianday(rec.borrowDate)) > 60
    `);
    let html = "<html><head><META HTTP-EQUIV='Content-Type' Content='text-html;charset=utf-8'></head><body>";
    html += "<table border=1 id='result'>";
    if (overdueReaders.length > 0) {
        overdueReaders.forEach(reader => {
            html += "<tr>";
            html += `<td>${reader.rID}</td>`;
            html += `<td>${reader.rName}</td>`;
            html += `<td>${reader.rSex}</td>`;
            html += `<td>${reader.rDept}</td>`;
            html += `<td>${reader.rGrade}</td>`;
            html += "</tr>";
        });
    }
    html += "</table></body></html>";
    res.send(html);
};

