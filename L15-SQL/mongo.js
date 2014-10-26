var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser());

var monk = require('monk');
var connection_string = 'localhost/fritter';

var db = monk(connection_string);
db.get('followers').index('follower');
db.get('messages').index('user');

app.get('/', function (req, res) {
    var user = req.cookies.user;

    if (user) {
        db.get('followers').find({follower: user}, function(e, following) {
            db.get('messages').find({user: {$in: following.map(function(x) { return x.followed; })}},
                                    function(e, messages) {
                                        res.render('fritter', {user: user,
                                                               messages: messages,
                                                               following: following});
                                    });
        });
    } else {
        db.get('messages').find({}, function(e, messages) {
            res.render('fritter', {user: user, messages: messages});
        });
    }
});

app.post('/login', function (req, res) {
    res.cookie('user', req.body.user);
    res.redirect('/');
});

app.post('/logout', function (req, res) {
    res.clearCookie('user');
    res.redirect('/');
});

app.post('/send', function (req, res) {
    var user = req.cookies.user;

    if (user) {
        db.get('messages').insert({user: user, text: req.body.text},
                                  function() { res.redirect('/'); });
    }
});

app.post('/follow', function (req, res) {
    var user = req.cookies.user;

    if (user) {
        db.get('followers').insert({follower: user, followed: req.body.user},
                                   function() { res.redirect('/'); });
    }
});

app.post('/unfollow', function (req, res) {
    var user = req.cookies.user;

    if (user) {
        db.get('followers').remove({follower: user, followed: req.body.user},
                                   function() { res.redirect('/'); });
    }
});

app.listen(8080);
