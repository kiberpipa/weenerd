//
// --- CLI ---
//

var timestap = function(original) {
      return function(msg) {
        original('%s - %s', (new Date()).toISOString(), msg);
      };
    },
    log = timestap(console.log),
    warn = timestap(console.warn);

console.log = console.warn = function() {};

var yargs = require('yargs')
  .wrap(process.stdout.columns)
  .usage('$0 [options]')
  .options('config', {
    alias: 'c',
    describe: 'Options provides in JSON file.'
  })
  .config('c')
  .options('username', {
    describe: 'Username.',
    alias: 'u'
  })
  .options('password', {
    describe: 'Password.',
    alias: 'p'
  })
  .demand(['username', 'password'])
  .describe('cookie-secret', 'Enabled signed cookie support.')
  .options('title', {
    describe: 'Name of server instance.',
    default: 'WeeCloud'
  })
  .options('port', {
    describe: 'Port.',
    alias: 'P',
    default: 8000
  })
  .options('verbose', {
    describe: 'Display more verbose.',
    alias: 'v',
    boolean: true,
    default: false
  })
  .options('help', {
    describe: 'Display the usage.',
    alias: 'h'
  })

var argv = yargs.argv;

if (argv.help) {
  yargs.showHelp();
  process.exit(0);
}

if (argv.verbose) {
  console.log = log;
  console.warn = warn;
}


//
// --- AUTHENTICATION (PASSPORT) ---
//


var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(function(username, password, done) {
  if (argv.username === username && argv.password === password) {
      console.log('Logged in.');
      return done(null, username);
  }
  console.warn('Wrong attempt: ' + username + '/' + password);
  return done(null, false, { message: 'Incorrect.' });
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


//
// --- MIDDLEWARE (EXPRESS) ---
//


var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    flash = require('express-flash'),
    app = express();

app
  .set('view engine', 'jade')
  .use('/bower_components', express.static(__dirname + '/bower_components'))
  .use('/static', express.static(__dirname + '/static'))
  .use(bodyParser())
  .use(cookieParser(argv['cookie-secret']))
  .use(session({
    secret: Math.random().toString() + (new Date()).valueOf().toString(),
    cookie: { maxAge: 60000 }
  }))
  .use(flash())
  .use(passport.initialize())
  .use(passport.session());

app.locals.title = argv.title;


//
//  --- ROUTES ---
//

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    ensureLoggedOut = require('connect-ensure-login').ensureLoggedOut;
    
// login
app.route('/login')
  .get(
    ensureLoggedOut('/'),
    function(req, res) {
      res.render('login', { messages: req.flash('error') });
    })
  .post(passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }));

// dashboard
app.route('/')
  .get(
    ensureLoggedIn('/login'),
    function(req, res) {
      res.render('dashboard', { user: req.user });
    });

// chat
app.route('/chat')
  .get(
    ensureLoggedIn('/login'),
    function(req, res) {
      console.log('chatting');
    });



//
// --- SERVER ---
//

var server = require('http').createServer(app),
   io = require('socket.io').listen(server);

server
  .listen(argv.port, function() {
    console.log(argv.title + ' started at: http://localhost:' + argv.port);
  });

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
