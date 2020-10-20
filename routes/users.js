var express = require('express');
var router = express.Router();
var csrf = require('csrf');
var tokens = new csrf();
let db = require('../models/index');


router.get('/login', (req, res, next) => {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  req.session.now_url = "/";
  var data = {
      title:'User/Login',
      form:{name:'',password:''},
      content:'',
  }
  res.render('users/login', data);
});


router.post('/login', (req, res, next) => {
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
        back = './home';
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

router.get('/home',(req, res, next)=> {
  if (req.session.login == null){
    res.redirect('/users/login');
  } else {
    res.render('users/home');
  }
});

router.get('/add',(req, res, next)=> {
  var secret = tokens.secretSync();
  var token = tokens.create(secret);
  req.session._csrf = secret;
  res.cookie('_csrf', token);
  req.session.now_url="/users/add";
  var data = {
    title: 'Users/Add',
    form: new db.User(),
    err:null
  }
  res.render('users/add', data);
});

router.post('/add',(req, res, next)=> {
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
    name: req.body.name,
    passWord: req.body.passWord,
    mailAddress: req.body.mailAddress,
  },
  {
    where:{id:req.body.id}
  }))
  .then(usr => {
    res.redirect('/users/login');
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
    res.redirect('/users/login');
  });
});

module.exports = router;
