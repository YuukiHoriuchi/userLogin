// HTTPエラーの対処を行うために必要な変数
var createError = require('http-errors');

// express本体をexpress変数に代入
var express = require('express');

// Node.jsに組み込まれている標準モジュールのpathモジュールを読み込む
// ファイルパスを扱うための変数
var path = require('path');

// クッキーのパース（値を変換する処理）に関する変数
var cookieParser = require('cookie-parser');

// HTTPリクエストのログ出力に関する変数
var logger = require('morgan');

// ルーツフォルダの中のファイルをモジュールとしてロードするための変数
var usersRouter = require('./routes/users');

// express-sessionを呼び出すための変数
var session = require('express-session');

//express-validatorを呼び出すための変数
var validator = require('express-validator');

var app = express();

// expressの基本的な設定を行う場所
// テンプレートファイルが保管されている場所を示している
app.set('views', path.join(__dirname, 'views'));
// テンプレートエンジンの種類を示している
app.set('view engine', 'ejs');

// app.useはアプリケーションで利用する関数を設定するため

// アクセスログを出力するために使う
// https://hylom.net/2013/03/25/use-logger-connect-middleware/
app.use(logger('dev'));
// Body-Parserを基にExpressに組み込まれた機能。クライアントから送信されたデータを、req.body経由で会得、操作するために使用
app.use(express.json());

// https://qiita.com/takehilo/items/d17eb5e077543bbaca25
// expressで使用するurlエンコードの拡張機能を使用しない
app.use(express.urlencoded({ extended: false }));
// expressでcookieを使用するための設定
app.use(cookieParser());

// イメージ、CSS ファイル、JavaScript ファイルなどの静的ファイルを提供するには、Express に標準実装されている express.static ミドルウェア関数を使用。
// 静的アセットファイルを格納しているディレクトリーの名前を express.static ミドルウェア関数に渡して、ファイルの直接提供を開始します。例えば、public というディレクトリー内のイメージ、CSS ファイル、JavaScript ファイルを提供するには、次のコードを使用。
app.use(express.static(path.join(__dirname, 'public')));

// express-validatorを使用するため
// https://www.wakuwakubank.com/posts/633-nodejs-express-validator/
app.use(validator());

app.use(session({
  //暗号化に利用するキーを設定
  secret: 'secret key',
  //毎回セッションを作成しない
  resave: false,
  //未初期化状態のセッションを保存しない
  saveUninitialized: false,
  cookie: {
    //生存期間は3日
    maxAge: 3 * 24 * 60 * 1000,
    //httpsを使用しない
    secure: false
  }
}));
// usersRouterを使用する
app.use('/users', usersRouter);

// https://qiita.com/syumiwohossu/items/f9ee317f31adc3ad387b
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// https://expressjs.com/ja/guide/error-handling.html
// https://qiita.com/nyandora/items/cd4f12eb62295c10269c
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;