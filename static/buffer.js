if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'moment',
  './nicknamelist',
  './color',
  './inputbox'
], function(React, moment, NicknameList, Color, InputBox, undefined) {
    
  // TODO: transform opacity when adding a new buffer line

  var Buffer = React.createClass({

    displayName: 'Buffer',
    
    getInitialState: function () {
      return {messages: this.props.buffer.messages,
              nicknamelist: []};
    },

    // see http://blog.vjeux.com/2013/javascript/scroll-position-with-react.html
    componentWillUpdate: function() {
      var node = this.getDOMNode().getElementsByClassName('buffer-window')[0];
      this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
    },
    
    componentDidUpdate: function() {
      if (this.shouldScrollBottom) {
        var node = this.getDOMNode().getElementsByClassName('buffer-window')[0];
        node.scrollTop = node.scrollHeight;
      }
    },
    
    render: function() {
      var buffer = this.props.buffer,
          self = this,
          name = buffer.info.short_name;
      // TODO: when updating topic, short_name has a funny name 
      return React.DOM.div({className: "row " + (this.props.isActive ? "" : " hidden")}, [
          React.DOM.div({className: "list-group col-lg-10"}, [
            React.DOM.h3({ key: 'title' }, name + ": " + buffer.info.title),
            React.DOM.ul({className: "buffer-window",
                         key: "listgroup",
                         style: {"overflow-y": "auto",
                                 "overflow-x": "hidden",
                                 height: "80vh"
                         }}, 
               buffer.messages.map(function (message) {
                   return React.DOM.li({className: "list-group-item row" + (message.highlight === 1 ? " list-group-item-info" : ""),
                                        key: message.pointers.join(" ")}, [
                       React.DOM.div({className: "col-sm-1 text-muted", key: "date"},
                                     moment.unix(message.date).format('hh:mm:ss')),
                       React.DOM.div({className: "col-sm-1 " + (message.tags_array.indexOf("irc_privmsg") === -1 ? "text-muted" : "text-primary"),
                                      key: "prefix",
                                      dangerouslySetInnerHTML: {__html: Color.format(message.prefix)}}),
                       React.DOM.div({className: "col-sm-10 " + (message.tags_array.indexOf("irc_privmsg") === -1 ? "text-muted" : ""),
                                      key: "message",
                                      dangerouslySetInnerHTML: {__html: Color.format(message.message)}}
                       )
                   ]);
               })
            ),
            InputBox({nicklist: this.props.buffer.nicklist,
                      handleSubmit: this.props.sendInputConstructor(this.props.buffer.info.pointers[0])})
          ]),
          NicknameList({nicklist: this.props.buffer.nicklist})
        ]);
    }

  });

  return Buffer;

});
