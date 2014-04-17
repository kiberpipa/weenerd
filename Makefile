BOWER = bower

all:

update:
	${BOWER} install

	mkdir -p static/lib
	cp bower_components/domready/ready.js static/lib
	cp bower_components/moment/moment.js static/lib
	cp bower_components/requirejs/require.js static/lib

	mkdir -p static/lib/react
	cp bower_components/react-async/react-async.js static/lib/react
	cp bower_components/react-router-component/react-router-component.js static/lib/react

	mkdir -p static/lib/bootstrap
	cp bower_components/bootstrap/dist/* static/lib/bootstrap -R


.PHONY: update 
