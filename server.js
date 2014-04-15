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
  .options('relay-host', {
    describe: 'Relay host.',
    default: 'localhost'
  })
  .options('relay-port', {
    describe: 'Relayt port.',
    default: '8888'
  })
  .options('relay-password', {
    describe: 'Relay password.',
    default: ''
  })
  .options('relay-ssl', {
    describe: 'Relay ssl.',
    default: false
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
  .use(passport.session())
  .use(function(req, res, next) {
    app.locals.request = req;
    app.locals.response = req;
    next();
  });

app.locals.title = argv.title;


//
//  --- ROUTES ---
//

var React = require('react'),
    ReactRouter = require('react-router-component'),
    AppRouter = require('./static/router'),
    url = require('url'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    ensureLoggedOut = require('connect-ensure-login').ensureLoggedOut;
    

var renderApp = function(req, res, next) {
  try {

    var content = React.renderComponentToString(
      AppRouter({ path: url.parse(req.url).pathname })
    );

    res.send(
      '<!doctype html>' +
      '<html>' +
      ' <head>' +
      '  <title>' + argv.title + '</title>' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
      '  <link type="text/css" rel="stylesheet" href="/bower_components/bootstrap/dist/css/bootstrap.min.css">' +
      '  <link type="text/css" rel="stylesheet" href="/static/main.css">' +
      ' </head>' +
      ' <body>' + content +
      '  <script data-main="/static/main.js" src="bower_components/requirejs/require.js"></script>' +
      ' </body>' +
      '</html>')

  } catch(err) {
    return next(err)
  }
};

app.route('/login')
  .get(ensureLoggedOut('/'), renderApp)
  .post(ensureLoggedOut('/'), passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }));

app.route('/logout')
  .get(ensureLoggedIn('/'), function(req, res, next) {
    req.logout();
    res.redirect('/');
  });

app.route('/')
  .get(ensureLoggedIn('/login'), renderApp)



//
// --- SERVER ---
//

var server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server
  .listen(argv.port, function() {
    console.log(argv.title + ' started at: http://localhost:' + argv.port);
  });


//
// --- SOCKET.IO ---
//

var weechat = require('weechat'),
    relay = weechat.connect(
      argv['relay-host'],
      argv['relay-port'],
      argv['relay-password'],
      argv['relay-ssl'],
      function() {
        console.log('Connected to ' +
                    argv['relay-host'] + ':' +
                    argv['relay-port'] + '!');
      }
    );

io.sockets.on('connection', function(socket) {

  var send = function(command, cb) {
    console.log('RELAY: ' + command);
    relay.send(command, function() { cb.apply(this, arguments); });
  };

  relay.on(function() {
    socket.emit('events', arguments); 
  });

  relay.on('error', function(error) {
    console.log('RELAY: ' + error.code + ' - ' + error.message);
  });

  // http://www.weechat.org/files/doc/devel/weechat_relay_protocol.en.html#commands

  socket.on('init', function(args, cb) {
    var password = args.password ? ' password=' + args.password : '',
        compression = args.compression ? ' compression=' + args.compression: '';

    if (args.compression && ['zlib', 'off'].indexOf(args.compression) === -1) {
      console.error('init command failed due compression set to "' +
                    args.compression + '", allowed values are "gzip" or "off".');
    } else {
      send('init'  + password + compression, cb);
    }
  });

  socket.on('hdata', function(args, cb) {
    var id = args.id ? args.id + ' ' : '',
        keys = args.keys ? ' ' + (args.keys || []).join(',') : '';

    if (!args.path) {
      console.error('hdata command failed due to missing path argument.');
    } else {
      send(id + 'hdata '  + args.path + keys, cb);
    }
  });

  socket.on('info', function(args, cb) {
    var id = args.id + ' ' || '';

    if (!args.name) {
      console.error('info command failed due to missing name argument.');
    } else {
      send(id + 'info '  + name, cb);
    }
  });

  socket.on('infolist', function(args, cb) {
    var id = args.id + ' ' || '',
        pointer = args.pointer + ' ' || '',
        arguments = args.arguments + ' ' || '';

    if (!args.name) {
      console.error('infolist command failed due to missing name argument.');
    } else {
      send(id + 'infolist '  + name + pointer  + arguments, cb);
    }
  });

  socket.on('nicklist', function(args, cb) {
    var id = args.id ? args.id + ' ' : '',
        buffer = ' ' + args.buffer || '';

    send(id + 'nicklist' + buffer, cb);
  });

  socket.on('input', function(args, cb) {
    var buffer = args.buffer || '', cmd;

    if (!args.buffer) {
      console.error('input command failed due to missing buffer argument.');
    } else if (!args.data) {
      console.error('input command failed due to missing data argument.');
    } else {
      send('input ' + buffer + ' ' + args.data, cb);
    }
  });

  ['sync', 'desync'].forEach(function(command) {
    socket.on(command, function(args, cb) {
      var buffers = '', options = '';

      if (args.buffers) {
        if (!Array.isArray(args.buffers)) {
          buffers = args.buffers;
        } else {
          buffers = args.buffers.join(',');
        }
      }
      if (buffers) {
        buffers = ' ' + buffers;
      }

      if (args.options) {
        if (!Array.isArray(args.options)) {
          optins = args.options;
        } else {
          options = args.options.join(',');
        }
      }
      if (options) {
        options = ' ' + options;
      }

      send(command + buffers + options, cb);
    });
  });

  socket.on('test', function(args, cb) {
    send('test', cb);
  });

  socket.on('ping', function(args, cb) {
    if (args) {
      args = ' ' + args;
    }
    send('test' + args, cb);
  });

  socket.on('quit', function(args, cb) {
    send('quit', cb);
  });

});
