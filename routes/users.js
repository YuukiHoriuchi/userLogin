var express = require('express');
var router = express.Router();
var csrf = require('csrf');
var tokens = new csrf();
let db = require('../models/index');

router.get('/login', (req, res, next) => {
  // secretはサーバー保持（session保持）
  var secret = tokens.secretSync();
  // tokenは（cookieで返却）クライアント返却
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  var data = {
    title:'User/Login',
    form:{name:'',password:''},
    content:'',
  }
  console.log(token);
  console.log(secret);
  console.log(req.session.sessionUrl);
  res.render('users/login', data);
});

router.post('/login', (req, res, next) => {
  var token = req.cookies._csrf;
  var secret = req.session._csrf;
  // 取得したtokenをverify（確認）して同じであればpostメソッドを実行する。
  // 確認が完了したtokenは確認した時点で破棄する。
  if(tokens.verify(secret, token) === false)
  {
    throw new Error('Invalid Token');
  }
  db.User.findOne({
    where:{
      name:req.body.name,
      passWord:req.body.passWord,
    }
  }).then(usr=>{
    if (usr != null) {
      req.session.login = usr;
      let back = req.session.back;
      if (back == null){
        if(req.session.sessionUrl == '/users/home2') {
          console.log(req.session.sessionUrl);
          res.redirect('/users/home2');
        } else if (req.session.sessionUrl == '/users/home3') {
          console.log(req.session.sessionUrl);
          res.redirect('/users/home3');
        } else {
          back = './home'
        }
      }
      res.redirect(back);
    } else {
      var data = {
        title:'User/Login',
        content:'名前かパスワードに入力間違いがあります。再度入力下さい。',
        form:'',
      }
      res.render('users/login', data);
    }
  })
});

router.get('/login2', (req, res, next) => {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  var data = {
    title:'User/Login/Miss',
    form:{name:'',password:''},
    content:'不正ログインがありました。お手数ですがログインをしてください。',
  }
  console.log(req.session.sessionUrl);
  res.render('users/login2', data);
});

router.post('/login2', (req, res, next) => {
  var token = req.cookies._csrf;
  var secret = req.session._csrf;
  if(tokens.verify(secret, token) === false)
  {
    throw new Error('Invalid Token');
  }
  db.User.findOne({
    where:{
      name:req.body.name,
      passWord:req.body.passWord,
    }
  }).then(usr=>{
    if (usr != null) {
      req.session.login = usr;
      let back = req.session.back;
      if (back == null){
        if(req.session.sessionUrl == '/users/home2') {
          console.log(req.session.sessionUrl);
          res.redirect('/users/home2');
        }else if (req.session.sessionUrl == '/users/home3') {
          console.log(req.session.sessionUrl);
          res.redirect('/users/home3');
        }else {
          back = './home'
        }
      }
      res.redirect(back);
    } else {
      var data = {
        title:'User/Login',
        content:'入力間違いがあります。再度ログインしてください。',
        form:'',
      }
      res.render('users/login2', data);
    }
  })
});

router.get('/logout', (req, res, next) => {
  req.session.destroy();
  res.redirect("/users/login");
});

router.get('/home',(req, res, next)=> {
  if (req.session.login == null){
    res.redirect('/users/login2');
  } else {
    req.session.sessionUrl='/users/home';
    console.log(req.session.sessionUrl);
    res.render('users/home');
  }
});

router.get('/home2',(req, res, next)=> {
  if (req.session.login == null){
    res.redirect('/users/login2');
  } else {
    req.session.sessionUrl="/users/home2";
    console.log(req.session.sessionUrl);
    res.render('users/home2');
  }
});

router.get('/home3',(req, res, next)=> {
  if (req.session.login == null){
    res.redirect('/users/login2');
  } else {
    req.session.sessionUrl="/users/home3";
    console.log(req.session.sessionUrl);
    res.render('users/home3');
  }
});

router.get('/add',(req, res, next)=> {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  req.session.sessionUrl="/users/add";
  var data = {
    title: 'Users/Add',
    form: new db.User(),
    err: null
  }
  console.log(req.session.sessionUrl);
  res.render('users/add', data);
});

router.post('/add',(req, res, next)=> {
  var token = req.cookies._csrf;
  var secret = req.session._csrf;
  if(tokens.verify(secret, token) === false)
  {
    throw new Error('Invalid Token');
  }
  const form = {
    name: req.body.name,
    passWord: req.body.passWord,
    mailAddress: req.body.mailAddress,
  };
  db.sequelize.sync()
    .then(() => db.User.create(form)
    .then(usr=> {
      res.redirect('/users/login')
    })
    .catch(err=> {
      var data = {
        title: 'Users/Add',
        form: form,
        err: err
      }
      res.render('users/add', data);
    })
    )
});

router.get('/forget', (req, res, next) => {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  req.session.sessionUrl="users/forget";
  var data = {
    title:'User/Forget',
    form:{name:'',passWord:'',mailAddress:''},
    content:'メールアドレスで認証してパスワードを変更します。',
  }
  console.log(req.session.sessionUrl);
  res.render('users/forget', data);
});
router.post('/forget', (req, res, next) => {
  var request = req;
  var response = res;
  var token = req.cookies._csrf;
  var secret = req.session._csrf;
  if(tokens.verify(secret, token) === false)
  {
    throw new Error('Invalid Token');
  }
  req.check('name','名前 は必ず入力して下さい。').notEmpty();
  req.check('passWord','パスワード は必ず入力して下さい。').notEmpty();
  req.check('mailAddress','メールアドレス は必ず入力して下さい。').notEmpty();
  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      var content = '';
      var result_arr = result.array();
      for(var n in result_arr) {
        content += + result_arr[n].msg
      }
      var data = {
        title: 'User/Forget',
        content:'名前、メールアドレスが入力されていません。入力をお願いします。',
        form: req.body,
      }
      console.log(data);
      response.render('users/forget', data);
    } else {
      request.session.login = null;
      var name = req.body.name;
      var passWord = req.body.passWord;
      var mailAddress = req.body.mailAddress;
      db.User.findAll({where:
      {
        name: name,
        mailAddress: mailAddress
      }}).then((model) => {
        if (model[0] == null){
          var data = {
            title:'User/Forget',
            content:'メールアドレスが違うため、認証することができません',
            form: req.body,
          };
          console.log(data);
          response.render('users/forget',data);
        } else {
          model[0].set({passWord:passWord}).save().then(()=>{
          response.redirect('/users/login');
          });
        }
      });
    }
  });
});

module.exports = router;
