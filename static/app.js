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
      self.socket.on('events', function() {
        console.log(arguments);
      });

      // get all buffers 
      self.socket.emit('hdata', {
        path: 'buffer:gui_buffers(*)'
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
