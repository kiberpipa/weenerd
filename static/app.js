if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'socket.io',
  './dashboard',
  './buffer'
], function(React, SocketIO, Dashboard, Buffer, undefined) {

  var App = React.createClass({

    displayName: 'App',

    getInitialState: function() {
      return {
        buffers: {},
        opened: [],
        active: undefined
      };
    },

    componentDidMount: function() {
      var self = this;

      self.socket = SocketIO.connect();

      // listen to all events from relay
      self.socket.on('events', function(event) {
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
            buffers[event[0].pointers[0]] = { info: event[0], messages: [] };
            self.setState({ buffers: buffers });
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
          console.log('EVENT MISSES:');
          console.log(event);
        }
      });

      // get all buffers 
      self.socket.emit('hdata', {
        path: 'buffer:gui_buffers(*)',
        keys: ['number', 'short_name', 'title', 'local_variables']
      }, function(buffers) {
        var buffersState = {};
        buffers.forEach(function(buffer) {
          if (['channel', 'private'].indexOf(buffer.local_variables.type) !== -1) {
            buffersState[buffer.pointers[0]] = { info: buffer, messages: [] };
          }
        });
        self.setState({ buffers: buffersState });
      });
    },

    componentDidUpdate: function(prevProps, prevState) {
      var self = this;

      // open buffers
      if (prevState.opened !== self.state.opened) {
        self.state.opened.forEach(function(uid) {

          // get initial messages for buffer
          if (prevState.opened.indexOf(uid) === -1) {
            self.socket.emit('hdata', {
              path: 'buffer:' + uid + '/own_lines/last_line(-10000)/data'
            }, function(messages) {
              var buffers = self.state.buffers;
              buffers[uid].messages = messages;
              self.setState({ buffers: buffers });
            });
          }
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

      this.setState(state);
    }, 

    render: function() {
      var self = this;
      return (
        React.DOM.div({}, [
          Dashboard({
            key: 'dahsboard',
            buffers: self.state.buffers,
            openBuffer: self.openBuffer
          }),
          React.DOM.div({ key: 'buffers' },
            self.state.opened.map(function(uid) {
              return Buffer({
                isActive: self.state.active === uid,
                buffer: self.state.buffers[uid]
              });
            })
          )
        ])
      );
    }
  });

  return App;

});
