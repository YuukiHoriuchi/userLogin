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
        back = '/';
      }
      res.redirect(back);
    } else {
      var data = {
        title:'Users/Login',
        content:'ログイン情報が間違っています。再度入力をお願いします。',
      }
      console.log('data');
      res.render('/users', data);
    }
  })
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
    name: req.body.name,
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




module.exports = router;
