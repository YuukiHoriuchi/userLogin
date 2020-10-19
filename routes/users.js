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
  db.sequelize.findOne({
    where:{
      loginName:req.body.loginName,
      passWord:req.body.passWord,
    }
  }).then(usr=> (
    if(usr != null) {
      req.session.login = usr;
      let back = req.session.back;
      if (back == null){
        back = '/';
      }
      res.redirect(back);
    } else {
      var data = {
        title : 'User/Login',
        content : '名前かパスワードに問題があります。ご確認ください。'
      }
      res.render('users/login', data);
    }
  });
});

router.get('/add',(req, res, next)=> {
  var data = {
    title: 'Users/Add',
    form: new db.User(),
    err:null
  }
  res.render('users/add', data);
});

router.post('/add',(req, res, next)=> {
  const form = {
    name: req.body.loginName,
    pass: req.body.passWord,
    mail: req.body.mailAddress,
  };
  db.sequelize.sync()
    .then(() => db.User.create(form)
    .then(usr=> {
      res.redirect('/users')
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

router.get('/edit',(req, res, next)=> {
  db.User.findByPk(req.query.id)
  .then(usr => {
    var data = {
      title: 'Users/Edit',
      form: usr
    }
    res.render('users/edit', data);
  });
});

router.post('/edit',(req, res, next)=> {
  db.sequelize.sync()
  .then(() => db.User.update({
    name: req.body.loginName,
    pass: req.body.passWord,
    mail: req.body.mailAddress,
  },
  {
    where:{id:req.body.id}
  }))
  .then(usr => {
    res.redirect('/users');
  });
});

router.get('/delete',(req, res, next)=> {
  db.User.findByPk(req.query.id)
  .then(usr => {
    var data = {
      title: 'Users/Delete',
      form: usr
    }
    res.render('users/delete', data);
  });
});

router.post('/delete',(req, res, next)=> {
  db.sequelize.sync()
  .then(() => db.User.destroy({
    where:{id:req.body.id}
  }))
  .then(usr => {
    res.redirect('/users');
  });
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


module.exports = router;
