var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');

var bodyParser = require('body-parser');
var session = require('express-session');
var validator = require('express-validator');


var app = express();

const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const PasswordReset = require('./models').PasswordReset;
const User = require('./models').User;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// テンプレート
//const mustacheExpress = require('mustache-express');
//app.engine('mst', mustacheExpress());
//app.set('view engine', 'mst');
//app.set('views', __dirname + '/views');

// 暗号化につかうキー
const APP_KEY = 'YOUR-SECRET-KEY';

// トップURL
const APP_URL = 'http://express41.test';

// メール送信設定
const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 1025,
  secure: '',
  auth: {
    user: '',
    pass: ''
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var session_opt = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
};

app.use(session(session_opt));
app.use('/users', usersRouter);

// パスワード忘れたユーザー向けの再発行ルート
app.get('/password/reset', (req, res) => {
  res.render('auth/passwords/email');
});

const passwordEmailValidationRules = [
  check('email')
    .not().isEmpty().withMessage('この項目は必須入力です。')
    .isEmail().withMessage('有効なメールアドレス形式で指定してください。')
    .custom((value, { req }) => {
      return User.findOne({
        where: {
          email: req.body.email
        }
      }).then(user => {
        if(!user) {
          throw new Error('このメールアドレスに一致するユーザーを見つけることが出来ませんでした。');
        }
      });
    })
];
app.post('/password/email', [passwordEmailValidationRules], (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) { // バリデーション失敗
    return res.status(422).json({ errors: errors.array() });
  }
  const email = req.body.email;
  const randomStr = Math.random().toFixed(36).substring(2, 38);
  const token = crypto.createHmac('sha256', APP_KEY)
    .update(randomStr)
    .digest('hex');
  const passwordResetUrl = APP_URL +'/password/reset/'+ token +'?email='+ encodeURIComponent(email);
  PasswordReset.findOrCreate({
    where: {
      email: email
    },
    defaults: {
      email: email,
      token: token,
      createdAt: new Date()
    }
  }).then(([passwordReset, created]) => {
    if(!created) {
      passwordReset.token = token;
      passwordReset.createdAt = new Date();
      passwordReset.save();
    }
    // メール送信
    transporter.sendMail({
      from: 'from@example.com',
      to: email,
      text: "以下のURLをクリックしてパスワードを再発行してください。\n\n"+ passwordResetUrl,
      subject: 'パスワード再発行メール',
    });
    res.json({ result: true });
  });
});
app.get('/password/reset/:token', (req, res) => {
  res.render('auth/passwords/reset', {
    token: req.params.token,
    email: req.query.email
  });
});
const passwordResetValidationRules = [
  check('email')
    .not().isEmpty().withMessage('この項目は必須入力です。')
    .isEmail().withMessage('有効なメールアドレス形式で指定してください。')
    .custom((value, { req }) => {
      return User.findOne({
        where: {
          email: req.body.email
        }
      }).then(user => {
        if(!user) {
          throw new Error('このメールアドレスに一致するユーザーを見つけることが出来ませんでした。');
        }
      });
    }),
  check('password')
    .not().isEmpty().withMessage('この項目は必須入力です。')
    .isLength({ min:8, max:25 }).withMessage('8文字から25文字にしてください。')
    .custom((value, { req }) => {
      if(req.body.password !== req.body.passwordConfirmation) {
        throw new Error('パスワード（確認）と一致しません。');
      }
      return true;
    })
];
app.post('/password/reset', [passwordResetValidationRules], (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) { // バリデーション失敗
    return res.status(422).json({ errors: errors.array() });
  }
  const email = req.body.email;
  const password = req.body.password;
  const token = req.body.token;
  PasswordReset.findOne({
    where: {
      email: email
    },
    include: [
      { model: User }
    ]
  }).then(passwordReset => {
    if(passwordReset &&
      passwordReset.token === token &&
      passwordReset.User) {
      const user = passwordReset.User;
      user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
      user.save();
      passwordReset.destroy();
      res.json({ result: true });
    } else {
      return res.status(422).json({
        errors: [
          {
            value: '',
            msg: 'このパスワードリセットトークンは無効です。',
            param: 'token',
            location: 'body'
          }
        ]
      });
    }
  });
});

// 直接アクセス
app.use(express.static('public'));

// 5000番ポートで待機
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`${PORT}番のポートで待機中です...`);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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