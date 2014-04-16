//
// --- UTILS --->
//

var ensureArray = function (maybeArray) {
  if (Array.isArray(maybeArray) !== true) {
    return [maybeArray];
  }  else {
    return maybeArray;
  }
};

// array of notifications that are unread
var unreadNotifications = [];

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
  .options('title', {
    describe: 'Name of weenerd instance.',
    default: 'weenerd - because fuck M0nd4y!'
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
// --- MIDDLEWARE (EXPRESS) ---
//


var express = require('express'),
    React = require('react'),
    ReactRouter = require('react-router-component'),
    AppRouter = require('./static/router'),
    url = require('url'),
    app = express();
    
app
  .use('/static', express.static(__dirname + '/static'))
  .get('/', function(req, res, next) {
  try {

    var content = React.renderComponentToString(
      AppRouter({ path: url.parse(req.url).pathname, documentTitle: argv.title })
    );

    res.send(
      '<!doctype html>' +
      '<html>' +
      ' <head>' +
      '  <title>' + argv.title + '</title>' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
      '  <link type="text/css" rel="stylesheet" href="/static/lib/bootstrap/css/bootstrap.min.css">' +
      '  <link href="data:image/x-icon;base64,AAABAAEAEBACAAAAAACwAAAAFgAAACgAAAAQAAAAIAAAAAEAAQAAAAAAQAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAHDgAADw8AAA+fAAAPnwAAD58AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA48cAAMGDAACBgQAAgAEAAIABAAAAAAAAAYAAAD/8AACX6QAAw8MAAOfvAAD//wAA" rel="icon" type="image/png" />' +
      '  <link type="text/css" rel="stylesheet" href="/static/main.css">' +
      ' </head>' +
      ' <body>' + content +
      '  <script data-main="/static/main.js" src="/static/lib/require.js"></script>' +
      ' </body>' +
      '</html>')

  } catch(err) {
    return next(err)
  }
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


//
// --- SOCKET.IO ---
//

var weechat = require('weechat'),
    crypto = require('crypto'),
    relay;


process.on('uncaughtException', function(error) {
  relay = undefined;
  console.dir(error);
});

io.set('log level', 1);
io.sockets.on('connection', function(socket) {

  var send = function(command, cb) {
    console.log('RELAY: ' + command);
    relay.send(command, function() {
      if (cb) {
        cb.apply(this, arguments);
      }
    });
  };

  setInterval(function() {

    // is relay still connected?
    if (relay) {
      send('ping ' + (new Date()).toString());
    
    // in case is not connected we try to connect to relay
    } else {
      console.log('Trying to connect to relay...');
      relay = weechat.connect(
        argv['relay-host'],
        argv['relay-port'],
        argv['relay-password'],
        argv['relay-ssl'],
        function() {

          console.log('Connected to ' +
                      argv['relay-host'] + ':' +
                      argv['relay-port'] + '!');

          relay.on('error', function(error) {
            console.log('RELAY: ' + error.code + ' - ' + error.message);
            if (error.code === 'EPIPE') {
              relay = undefined;
              socket.emit('relay:disconnected');
            }
            socket.emit('relay:error', { code: error.code, message: error.message });
          });

          socket.emit('relay:connected');
        }
      );
    }

  }, 5000);

  socket.on('client:initialized', function() {
    if (relay) {
      socket.emit('relay:connected');
      if (unreadNotifications.length > 0) {
         socket.emit('notifications', unreadNotifications);
      }
    }
    
    relay.on(function() {
      socket.emit('relay:events', arguments); 
      
      // emit notifications for private chat and nick highlight
      // handle server-side state what notifications are pending
      ensureArray(arguments[0]).forEach(function(event) {
          if (event.highlight === 1 || (event.tags_array && event.tags_array.indexOf("notify_private") > -1)) {
              var shasum = crypto.createHash('sha1');
              shasum.update(JSON.stringify(event));
              var hash = shasum.digest('hex'),
                  notification = {
                      hash: hash,
                      event: event
                  };
              unreadNotifications.push(notification);
              socket.emit('notifications', [notification]);
          }
      });
    });
  });
  
  socket.on('notification:markread', function(args, cb) {
      unreadNotifications = unreadNotifications.filter(function (notification) {
          return args.notifications.indexOf(notification.hash) === -1;
      });
  });

  //
  // forwarding all weechat relat commands from client to relay
  //
  // http://www.weechat.org/files/doc/devel/weechat_relay_protocol.en.html#commands
  //

  socket.on('relay:init', function(args, cb) {
    var password = args.password ? ' password=' + args.password : '',
        compression = args.compression ? ' compression=' + args.compression: '';

    if (args.compression && ['zlib', 'off'].indexOf(args.compression) === -1) {
      console.error('init command failed due compression set to "' +
                    args.compression + '", allowed values are "gzip" or "off".');
    } else {
      send('init'  + password + compression, cb);
    }
  });

  socket.on('relay:hdata', function(args, cb) {
    var id = args.id ? args.id + ' ' : '',
        keys = args.keys ? ' ' + (args.keys || []).join(',') : '';

    if (!args.path) {
      console.error('hdata command failed due to missing path argument.');
    } else {
      send(id + 'hdata '  + args.path + keys, cb);
    }
  });

  socket.on('relay:info', function(args, cb) {
    var id = args.id + ' ' || '';

    if (!args.name) {
      console.error('info command failed due to missing name argument.');
    } else {
      send(id + 'info '  + name, cb);
    }
  });

  socket.on('relay:infolist', function(args, cb) {
    var id = args.id + ' ' || '',
        pointer = args.pointer + ' ' || '',
        arguments = args.arguments + ' ' || '';

    if (!args.name) {
      console.error('infolist command failed due to missing name argument.');
    } else {
      send(id + 'infolist '  + name + pointer  + arguments, cb);
    }
  });

  socket.on('relay:nicklist', function(args, cb) {
    var id = args.id ? args.id + ' ' : '',
        buffer = ' ' + args.buffer || '';

    relay.send(id + 'nicklist' + buffer, function(nicklist) {
      nicklist = ensureArray(nicklist);
      cb.apply(this, nicklist);
    });
  });

  socket.on('relay:input', function(args, cb) {
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
    socket.on('relay:' + command, function(args, cb) {
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
          options = args.options;
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

  socket.on('relay:test', function(args, cb) {
    send('test', cb);
  });

  socket.on('relay:ping', function(args, cb) {
    if (args) {
      args = ' ' + args;
    }
    send('ping' + args, cb);
  });

  socket.on('relay:quit', function(args, cb) {
    send('quit', cb);
  });

});
