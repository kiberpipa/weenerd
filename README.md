An attempt to build WeeChat Relay Client using:

 - Node: http://nodejs.org
 - Connect/Express: http://www.senchalabs.org/connect
 - SocketIO: http://socket.io
 - React: http://facebook.github.io/react

Features:

 - responsive design (WIP)
 - notifications when somebody pings you on privmsg or channel
 - searchable channel list
 - autocomplete nicknames
 - resolve https(s) links in chat

Install:

 - On weechat: /set relay.network.password <pass>
 - On weechat: /relay add weechat <port>
 - $ git clone https://github.com/kiberpipa/weenerd.git
 - $ npm install
 - $ node server.js --relay-host localhost --relay-port <port> --relay-password <pass>
