var optimist = require('optimist'),
    argv = optimist
      .usage('$0 [options]')
      .alias('p', 'port')
        .default('p', 8000)
        .describe('p', 'port on which weecloud should run')
      .alias('h', 'help')
        .describe('h', 'Display the usage')
      .argv

if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

var routes = function (app) {
  console.log(app);
  console.log(app.get);
  app.get('/', function() {
    return 'KINDA WORKS!';
  });
};

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(function(username, password, done) {
  if (username === 'garbas' &&
      password === 'rokrok3') {
      return done(null, username);
  } 
  return done(null, false, { message: 'Incorrect.' });
}));
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});



var path = require('path'),
    connect = require('connect'),
    flash = require('connect-flash'),
    redirect = require('connect-redirection'),
    connectRoute = require('connect-route'),
    app = connect();

app
  .use('/bower_components', connect.static(__dirname + '/bower_components'))
  .use(connect.query())
  .use(connect.bodyParser())
  .use(connect.cookieParser())
  .use(connect.session({ secret: 'whodunnit', cookie: { maxAge: 60000 }}))
  .use(redirect())
  .use(flash())
  .use(passport.initialize())
  .use(passport.session())
  .use(connectRoute(function(route) {

    route.get('/', function(request, response, next) {
      if (!request.user) {
        response.redirect('/login');
        return;
      }

      try {

        var output = '' +
          '<!doctype html>' +
          '<html>' +
          '<head><title>WeeCloud - Login</title></title></head>' +
          '<body>'+
          '<h3>Logged in.</h3>' +
          '<p>Hello ' + request.user + '.</h3>' +
          '<p><a href="/logout">Logout</a></p>' +
          '</body>' +
          '</html>';

        response.writeHead(200, {
          'Content-Length': output.length,
          'Content-Encoding': 'utf-8',
          'Content-Type': 'text/html'
        });

        response.end(output);

      } catch (e) {
        return next(e);
      }
    });

    route.get('/login', function(request, response, next) {
      if (request.user) {
        response.redirect('/');
      }

      var output = '' +
        '<!doctype html>' +
        '<html>' +
        '<head><title>WeeCloud - Login</title></title></head>' +
        '<body><h3>' + request.flash('error') +'</h3>' +
        '<form action="/login" method="post"><div><label>Username:</label><input type="text" name="username"/></div><div><label>Password:</label><input type="password" name="password"/></div><div><input type="submit" value="Log In"/></div></form>' +
        '</body>' +
        '</html>';

      response.writeHead(200, {
        'Content-Length': output.length,
        'Content-Encoding': 'utf-8',
        'Content-Type': 'text/html'
      });

      response.end(output);
    });

    route.post('/login', passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    }));

    route.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });

  }));


var http = require('http');

http
  .createServer(app)
  .listen(argv.port, function() {
    console.log('Point your browser at http://localhost:' + argv.port);
  });
