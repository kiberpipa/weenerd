if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'socket.io',
], function(React, SocketIO, undefined) {

  var Chat= React.createClass({

    displayName: 'Chat',

    getInitialState: function() {
      return {
        buffers: [],
        openedBuffers: [],
        focusedBuffer: undefined
      };
    },

    componentDidMount: function() {
      var self = this,
          socket = SocketIO.connect();
      socket.emit('connect', {}, function(buffers) {
        self.setState({ buffers: buffers });
      });
    },

    render: function() {
      var self = this;
      return (
        React.DOM.div({}, [
          React.DOM.ul({ key: 'buffers'},
            this.state.buffers
              .reduce(function(prev, item) {
                if (['channel', 'private'].indexOf(item.local_variables.type) !== -1) {
                  prev.push(item);
                }
                return prev;
              }, [])
              .map(function(buffer) {
                var bufferUID = buffer.pointers[0];  
                return (
                  React.DOM.li({ key: bufferUID },
                    React.DOM.a({
                      href: "#",
                      onClick: function() {
                        var newState = {
                          openedBuffers: self.state.openedBuffers,
                          focusedBuffer: bufferUID
                        };
                        if (newState.openedBuffers.indexOf(bufferUID) === -1) {
                          newState.openedBuffers = newState.openedBuffers.concat([ bufferUID ]);
                        }
                        self.setState(newState);
                      }, 
                    }, buffer.short_name
                  ))
                );
              })
          )
        ])
      );
    }
  });

  return Chat;

});
