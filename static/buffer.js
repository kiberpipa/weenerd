if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'moment',
  './nicknamelist'
], function(React, moment, NicknameList, undefined) {
    
  // TODO: transform opacity when adding a new buffer line
  function parseColor(text) {
      return text;
  }

  var Buffer = React.createClass({

    displayName: 'Buffer',
    
    getInitialState: function () {
      return {messages: this.props.buffer.messages,
              nicknamelist: []};
    },

    // see http://blog.vjeux.com/2013/javascript/scroll-position-with-react.html
    componentWillUpdate: function() {
      // TODO: ugly as fuck, get by ID
      var node = this.getDOMNode().children[0];
      this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
    },
    
    componentDidUpdate: function() {
      if (this.shouldScrollBottom) {
        var node = this.getDOMNode().children[0];
        node.scrollTop = node.scrollHeight;
      }
    },
    
    render: function() {
      var buffer = this.props.buffer,
          name = buffer.info.short_name;
      console.log("Buffer", this.props.buffer);
      return React.DOM.div({className: "row " + (this.props.isActive ? "" : " hidden")}, [
          //React.DOM.h3({ key: 'title' }, name),
          React.DOM.ul({className: "list-group col-lg-10",
                       key: "listgroup",
                       style: {"overflow-y": "auto",
                               "overflow-x": "hidden",
                               "height": 500}}, 
             buffer.messages.map(function (message) {
                 return React.DOM.li({className: "list-group-item row" + (message.highlight === 1 ? " list-group-item-info" : ""),
                                      key: message.pointers.join(" ")}, [
                     React.DOM.div({className: "col-sm-1 text-muted", key: "date"},
                                   moment.unix(parseInt(message.date)).format('hh:mm:ss')),
                     React.DOM.div({className: "col-sm-1 text-primary", key: "prefix"}, parseColor(message.prefix)),
                     React.DOM.div({className: "col-sm-10", key: "message"}, parseColor(message.message))
                 ]);
             })
          ),
          NicknameList({nicklist: this.props.buffer.nicklist})
        ]);
    }

  });

  return Buffer;

});
