An attempt to build WeeChat Relay Client in one Monday (which got extended over ~three days).

# Technologies

 - Node: http://nodejs.org
 - Connect/Express: http://www.senchalabs.org/connect
 - SocketIO: http://socket.io
 - React: http://facebook.github.io/react

# Features

 - responsive design (WIP)
 - notifications when somebody pings you on privmsg or channel
 - searchable channel list (WIP)
 - autocomplete nicknames
 - resolve https(s) links in chat

# Install

 - On weechat: /set relay.network.password foobar
 - On weechat: /relay add weechat 8001
 - $ git clone https://github.com/kiberpipa/weenerd.git
 - $ npm install
 - $ node server.js --relay-host localhost --relay-port 8001 --relay-password foobar

# Screenshots

![Screenshot 1](http://i.imgur.com/ss3lklU.png)


[![Support via Gittip](https://rawgithub.com/twolfson/gittip-badge/0.2.0/dist/gittip.png)](https://www.gittip.com/Kiberpipa/)

**IRC:** weenerd @ chat.freenode.org
