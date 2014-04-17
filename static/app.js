if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'socket.io',
  './cookie',
  './dashboard',
  './color',
  './buffer'
], function(React, SocketIO, Cookie, Dashboard, Color, Buffer, undefined) {

  function setdefaults(object, defaults) {
    if (object === undefined) {
      object = {};
    }
    Object.keys(defaults).forEach(function(key) {
      if (object[key] === undefined) {
        object[key] = defaults[key];
      }
    });
    return object;
  }

  var App = React.createClass({

    displayName: 'App',

    getInitialState: function() {
      return {
        connected: false,
        buffers: {},
        opened: [],
        notifications: [],
        active: undefined
      };
    },

    fetchBuffers: function(uid, cb) {
      var self = this;

      uid = uid || 'gui_buffers(*)' 

      self.socket.emit('relay:hdata', {
        path: 'buffer:' + uid,
        keys: ['number', 'full_name', 'short_name', 'title', 'local_variables']
      }, function(buffersInfo) {
        var buffers = {};

        if (!Array.isArray(buffersInfo)) {
          buffersInfo = [ buffersInfo ];
        }

        buffersInfo = buffersInfo.filter(function(bufferInfo) {
          return bufferInfo.local_variables.type !== 'relay';
        });

        buffersInfo.forEach(function(bufferInfo) {
          buffers[bufferInfo.pointers[0]] = setdefaults(
            buffers[bufferInfo.pointers[0]],
            { info: {}, messages: [], nicklist: [] }
          );
          buffers[bufferInfo.pointers[0]].info = bufferInfo;
        });

        buffers = setdefaults(buffers, self.state.buffers);
        self.setState({ buffers: buffers });

        if (cb) {
          cb(buffersInfo);
        }
      });
    },

    fetchBufferMessages: function(uid, cb) {
      var self = this;

      self.socket.emit('relay:hdata', {
        path: 'buffer:' + uid + '/own_lines/last_line(-100)/data'
      }, function(messages) {
        var buffers = self.state.buffers;

        if (!buffers[uid]) {
          buffers[uid] = {};
        }
        buffers[uid] = setdefaults(buffers[uid], { info: {}, messages: [], nicklist: [] });
        buffers[uid].messages = messages.reverse();

        self.setState({ buffers: buffers });

        if (cb) {
          cb(uid);
        }
      });
    },

    fetchBufferNicklist: function(uid, cb) {
      var self = this;

      self.socket.emit("relay:nicklist", {
        buffer: uid
      }, function () {
        var nicks = Array.prototype.slice.call(arguments);
        var buffers = self.state.buffers;

        if (!buffers[uid]) {
          buffers[uid] = {};
        }
        buffers[uid] = setdefaults(buffers[uid], { info: {}, messages: [], nicklist: [] });
        buffers[uid].nicklist = nicks
          .filter(function (nick) {
            return (nick.group === 0 && nick.level === 0);
          })
          .map(function (nick) {
            return nick.name;
          });

        self.setState({ buffers: buffers });

        if (cb) {
          cb(uid);
        }
      });
    },
    
    markNotificationsAsRead: function(notifications) {
       this.socket.emit('notification:markread', {notifications: notifications}); 
       
       // filter notifications by hash
       this.setState({
           notifications: this.state.notifications.filter(function (notification) {
              return notifications.map(function (n){ return n.hash;}).indexOf(notification.hash) === -1;
           })
       });
    },

    handleOnConnect: function() {
      var self = this,
          opened = Cookie.getItem('opened'),
          active = Cookie.getItem('active'),
          state = {};

      // on every socket connect set to initial state
      state = self.getInitialState();
      if (opened) {
        state.opened = opened.split(',').filter(function(buffer) {
          return Object.keys(self.state.buffers).indexOf(buffer) !== -1;
        });
      }
      if (active && Object.keys(self.state.buffers).indexOf(active) !== -1) {
        state.active = active;
      }
      self.setState(state);

      // get all buffers 
      self.fetchBuffers(undefined, function() {

        // open buffers from cookie
        state = { connected: true };
        
        

        if (opened) {
          state.opened = opened.split(',').filter(function(buffer) {
            return Object.keys(self.state.buffers).indexOf(buffer) !== -1;
          });
        }

        if (active && Object.keys(self.state.buffers).indexOf(active) !== -1) {
          state.active = active;
        }

        if (Object.keys(state).length !== 0) {
          self.setState(state);
        }

      });
    },

    componentDidMount: function() {
      var self = this;
      
      // request for notification permissions
      window.Notification.requestPermission(function(permission) {
        window.Notification.permission = permission;
      });
      
      self.socket = SocketIO.connect();
      
      self.socket.on('notifications', function(notifications) {
          // ignore notifications for active buffer
          // TODO: we shouldn't ignore if tab is not focused
          notifications = notifications.filter(function (n) { 
              return n.event.buffer != self.state.active;
          });
          
          self.setState({notifications: self.state.notifications.concat(notifications)});
          
          // notify 
          if (window.Notification.permission === "granted") {
              notifications.forEach(function (notification) {
                var n = new window.Notification(Color.format(self.state.buffers[notification.event.buffer].info.short_name), {
                    body: Color.format(notification.event.prefix + " " + notification.event.message),
                    icon: "http://www.favicon.cc/logo3d/449619.png"
                });
                
                n.onclick = function(x) { 
                    window.focus();
                    self.openBuffer(notification.event.buffer);
                    // TODO: scroll to the right position in bufferS1
                };
                
                // autoclose after 5sec
                setTimeout(function() {n.close()}, 5000); 
              });
              
          }
          
      });

      self.socket.on('relay:error', function (error) {
        console.log('ERROR: ' + error.code + ' - ' + error.message);
        if (error.code === 'EPIPE') {
          self.setState({ connected: false });
        }
      });

      // listen to all (non error) events from relay
      self.socket.on('relay:events', function(event) {
        var buffers = self.state.buffers,
            opened = self.state.opened,
            active = self.state.active;

        if (event[1] === '_buffer_line_added') {
          console.log('_buffer_line_added');
          if (buffers[event[0].buffer]) {
            buffers[event[0].buffer].messages.push(event[0]);
            self.setState({ buffers: buffers });
          }

        } else if (event[1] === '_buffer_opened') {
          console.log('_buffer_opened');
          if (Object.keys(self.state.buffers).indexOf(event[0].pointers[0]) === -1) {
            buffers[event[0].pointers[0]] = { info: event[0], messages: [], nicklist: [] };
            self.setState({ buffers: buffers });
            self.fetchBuffers(event[0].pointers[0]);
          }

        } else if (event[1] === '_buffer_closing') {
          console.log('_buffer_closing');
          if (Object.keys(self.state.buffers).indexOf(event[0].pointers[0]) !== -1) {
            delete self.state.buffers[event[0].pointers[0]];

            if (event[0].pointers[0] === active) {
              active = undefined;
            }

            if (opened.indexOf(event[0].pointers[0]) !== -1) {
              opened.splice(opened.indexOf(event[0].pointers[0]), 1);
            }

            self.setState({
              active: active,
              buffers: buffers,
              opened: opened
            });
          }

        } else if (event[1] === '_buffer_title_changed') {
          console.log('_buffer_title_changed');
          buffers[event[0].pointers[0]].info.title = event[0].title;
          self.setState({ buffers: buffers });

        } else {
          console.log('EVENT MISSED:');
          console.log(event);
        }
      });

      self.socket.on('relay:connected', function () {
        self.handleOnConnect();
      });

      // we gracefully handle disconnect
      self.socket.on('disconnect', function () {
        self.setState({ connected: false });
        console.log('Socket is disconnected.');
      });

      // TODO: on reconnect we should probably remove current notifications
      // since they will be re-fetched
      //self.setState({notifications: []});
      self.socket.emit('client:initialized');

    },

    componentDidUpdate: function(prevProps, prevState) {
      var self = this,
          title_prefix,
          num_notifications = self.state.notifications.length;
          
      if (num_notifications > 0) {
          title_prefix = '(' + num_notifications+ ')'
      } else {
          title_prefix = '';
      }
      
      if (this.activeBuffer()) {
          title_prefix = title_prefix + ' ' + this.activeBuffer().info.short_name;
      }
      document.title = title_prefix + ' | ' + self.props.documentTitle;


      // open buffers
      if (prevState.opened !== self.state.opened) {

        // write buffers to cookie
        Cookie.setItem('opened', self.state.opened.join(','));
        Cookie.setItem('active', self.state.active);

        // fetch messages for each open relay
        self.state.opened.forEach(function(uid) {
          self.fetchBufferMessages(uid, self.fetchBufferNicklist);
        });
      }
    },
    
    sendInputConstructor: function(buffer) {
      var self = this;
      return function (value) {
        self.socket.emit('relay:input', {
            'buffer': buffer,
            'data': value
        });  
      }
    },

    openBuffer: function(uid) {
      var state = {
        opened: this.state.opened,
        active: uid
      };

      if (state.opened.indexOf(uid) === -1) {
        state.opened = state.opened.concat([ uid ]);
      }
      
      this.markNotificationsAsRead(this.state.notifications.filter(function (n) {
          return n.event.buffer == uid;
      }));

      this.setState(state);
    }, 
    
    activeBuffer: function() {
      return this.state.buffers[this.state.active]
    },
    
    closeBuffer: function(uid) {
      this.socket.emit('relay:input', {
          'buffer': uid,
          'data': "/close"
      });
    },

    render: function() {
      var self = this,
          connecting = this.props.layout.connecting || {};

      if (self.state.connected === false) {
        return (
          React.DOM.div({ style: connecting.outer || {}},
            React.DOM.div({ style: connecting.inner || {}}, [
              React.DOM.div({ style: { textAlign: 'center' } }, 'Connecting ...'),
              React.DOM.div({ className: 'progress progress-striped active' },
                React.DOM.div({ className: 'progress-bar', role: 'progressbar',
                                ariaValuenow: '100', ariaValuemin: '0',
                                ariaValuemax: '100', style: { width: '100%' }},
                  React.DOM.span({ className: 'sr-only'}, 'Loading...')
                )
              )
            ])
          )
        );
      }

      return (
        React.DOM.div({}, [
          Dashboard({
            key: 'dashboard',
            buffers: self.state.buffers,
            openBuffer: self.openBuffer,
            closeBuffer: self.closeBuffer,
            notifications: self.state.notifications,
            markNotificationsAsRead: self.markNotificationsAsRead,
            layout: this.props.layout || {}
          }),
          React.DOM.div({ key: 'buffers', className: 'buffers' },
            self.state.opened.map(function(uid) {
              return Buffer({
                isActive: self.state.active === uid,
                buffer: self.state.buffers[uid],
                sendInputConstructor: self.sendInputConstructor,
                layout: self.props.layout || {}
              });
            })
          )
        ])
      );
    }
  });

  return App;

});
