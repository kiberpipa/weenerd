if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'react-router-component',
  './app',
  './login'
], function(React, Router, App, Login, undefined) {

  var AppRouter = React.createClass({

    displayName: 'AppRouter',

    getDefaultProps: function() {
      return {
        layout: {},
        documentTitle: ""
      };
    },

    getInitialState: function() {
      return {
        layout: {},
        documentTitle: this.props.documentTitle
      }
    },

    calculateLayout: function(width, height) {
      if (width < 768) { // mobile
        return {
          connecting: {
            outer: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height
            },
            inner: {
              position: 'relative',
              top: (height / 2) - 50,
              left: 0.2 * width,
              width: 0.6 * width
            }
          },
          login: { 
            position: 'absolute',
            top: ((height - 200) / 2) - 30,
            left: 15,
            right: 15,
            height: 200 
          },
          dashboard: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: height,
            right: 0 
          },
          buffer: {
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'absolute',
            top: 0,
            left: 0,
            height: height - 30,
            right: 0,
            margin: 0,
            padding: 0
          },
          bufferTitle: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: width,
            zIndex: 1000,
            overflow: 'hidden',
            height: '2em',
            padding: '0 0.5em',
            margin: 0,
            lineHeight: '2em'
          },
          bufferInput: {
            wrapper: {
              position: 'absolute',
              left: 0,
              top: height - 34,
              height: 34
            },
            input: {
              borderRadius: '0',
              width: width - 57
            },
            button: {
              borderRadius: '0',
              width: 58
            }
          },
          nicklist: {
            display: 'none'
          }
        };
      } else { // desktop
        return {
          connecting: {
            outer: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: width,
              height: height
            },
            inner: {
            }
          },
          login: { 
            position: 'absolute',
            top: (height - 200) / 2,
            left: (width - 330) / 2,
            width: 300,
            height: 200
          },
          dashboard: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: 200,
            height: height,
            padding: 0,
            overflowY: 'auto'
          },
          buffer: {
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'absolute',
            top: 0,
            left: 200,
            width: width - 400,
            height: height - 33,
            margin: 0,
            padding: 0,
            borderRadius: '0'
          },
          bufferTitle: {
            position: 'absolute',
            top: 0,
            left: 200,
            width: width - 400,
            zIndex: 1000,
            overflow: 'hidden',
            height: '2em',
            padding: '0 0.5em',
            margin: 0,
            lineHeight: '2em'
          },
          bufferInput: {
            wrapper: {
              position: 'absolute',
              left: 200,
              width: width - 400,
              top: height - 34,
              height: 34
            },
            input: {
              borderRadius: '0'
            },
            button: {
              borderRadius: '0',
              width: 58
            }
          },
          nicklist: {
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'absolute',
            right: 0,
            width: 200,
            top: 0,
            height: height
          }
        };
      }
    },

    componentDidMount: function() {
      var self = this;
      self.setState({
        layout: self.calculateLayout(window.innerWidth, window.innerHeight),
        documentTitle: document.title
      });
      window.addEventListener('resize', function(e) {
        self.setState({
          layout: self.calculateLayout(window.innerWidth, window.innerHeight)
        });
      });

    },

    render: function() {
      var hidden = Object.keys(this.state.layout).length === 0 ? { display: 'none' } : {};
      return (
        React.DOM.div({ style: hidden },
          Router.Locations({ path: this.props.path }, [
            Router.Location({ layout: this.state.layout, path: '/', documentTitle: this.state.documentTitle, handler: App }),
            Router.Location({ layout: this.state.layout, path: '/login', handler: Login })
          ])
        )
      );
    }
  });

  return AppRouter;

});
