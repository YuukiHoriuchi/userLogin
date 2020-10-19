var express = require('express');
var router = express.Router();
var csrf = require('csrf');
var tokens = new csrf();
let db = require('../models/index');


router.get('/', (req, res, next) => {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  req.session.now_url = "/";

  var data = {
      title:'User/Login',
      form:{name:'',password:''},
  }
  res.render('users/login', data);
});

router.post('/', (req, res, next) => {
  var request = req;
  var response = res;
  var token = req.cookies._csrf;
  var secret = req.session._csrf;
  if(tokens.verify(secret, token) === false)
  {
    throw new Error('Invalid Token');
  }
  const form = {
    name: req.body.name,
    passWord: req.body.passWord,
  };
  db.sequelize.aync()
    .then(() => )

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      var content = '';
      var result_arr = result.array();
      for(var n in result_arr) {
        content += result_arr[n].msg
      }

      var data = {
        title: 'ログイン',
        content:content,
        form: req.body,
      }
      response.render('users/login', data);
    } else {
      var nm = req.body.name;
      var pw = req.body.password;
      console.log(db.user);
      db.user.findAll({
        where:{
          name: nm,
          password: pw
        }}).then((model) => {
          if (model == null){
            var data = {
              title:'ログイン',
              content:'名前またはパスワードが違います。',
              form: req.body,
          };
          response.render('users/login',data);
          } else {
            console.log(model[0]);
            request.session.login = model[0];
            res.redirect('/');
          }
        });
      }
  })
});

router.get('/forget', (req, res, next) => {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  req.session.now_url="users/forget";
  var data = {
    title:'パスワード変更',
    form:{name:'',password:'',birthday:''},
    content:'誕生日をキーとしてパスワードを変更します。',
  }
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
  req.check('password','パスワード は必ず入力して下さい。').notEmpty();
  req.check('birthday','誕生日 は必ず入力して下さい。').notEmpty();
  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      var content = '';
      var result_arr = result.array();
      for(var n in result_arr) {
        content +=  + result_arr[n].msg
      }
      var data = {
        title: 'パスワード変更',
        content:content,
        form: req.body,
      }
      response.render('users/add', data);
      } else {
        request.session.login = null;
        var nm = req.body.name;
        var pw = req.body.password;
        var bd = req.body.birthday;
        db.user.findAll({where:{
          name: nm,
          birthday: bd
          }}).then((model) => {
          if (model[0] == null){
            var data = {
              title:'パスワード変更',
              content:'誕生日が違うためパスワード変更できません',
              form: req.body,
              };
              response.render('users/forget',data);
              } else {
              model[0].set({password:pw}).save().then(()=>{
              response.redirect('/');
              });
            }});
      }
  });
});


router.get('/add', (req, res, next) => {
   var secret = tokens.secretSync();
   var token = tokens.create(secret);
   req.session._csrf = secret;
   res.cookie('_csrf', token);
   req.session.now_url="/users/add";
   var data = {
      title:'ユーザ追加',
      form:{name:'',password:'',birthday:''},
      content:'',
   }
   res.render('users/add', data);
});

router.post('/add', (req, res, next) => {
   var request = req;
   var response = res;
   var token = req.cookies._csrf;
   var secret = req.session._csrf;
   if(tokens.verify(secret, token) === false)
   {
      throw new Error('Invalid Token');
   }
   req.check('name','名前 は必ず入力して下さい。').notEmpty();
   req.check('password','パスワード は必ず入力して下さい。').notEmpty();
   req.check('birthday','誕生日 は必ず入力して下さい。').notEmpty();
   req.getValidationResult().then((result) => {
      if (!result.isEmpty()) {
         var content = '';
         var result_arr = result.array();
         for(var n in result_arr) {
            content +=  + result_arr[n].msg
         }
         var data = {
            title: 'ユーザ追加',
            content:content,
            form: req.body,
         }
         response.render('users/add', data);
      } else {
         request.session.login = null;
         db.user.create({
                name: req.body.name,
                password: req.body.password,
                birthday:req.body.birthday
             }).then((model) => {
            response.redirect('/');
         });
      }
   });
});

module.exports = router;
