BOWER = bower
NPM = npm

all:

assets:
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

node_modules/karma:
	$(NPM) install karma@0.12.9 --prefix=node_modules

node_modules/karma-mocha:
	$(NPM) install karma-mocha@0.1.3 --prefix=node_modules

node_modules/karma-requirejs:
	$(NPM) install karma-requirejs@0.2.1 --prefix=node_modules

node_modules/karma-chrome-launcher:
	$(NPM) install karma-chrome-launcher@0.1.3 --prefix=node_modules

node_modules/karma-react-jsx-preprocessor:
	$(NPM) install karma-react-jsx-preprocessor@0.1.0 --prefix=node_modules

node_modules/expect.js:
	$(NPM) install expect.js@0.3.1 --prefix=node_modules

test: node_modules/karma node_modules/karma-mocha node_modules/karma-requirejs node_modules/karma-chrome-launcher node_modules/karma-react-jsx-preprocessor node_modules/expect.js
	CHROME_BIN=`which chromium` node_modules/karma/bin/karma start tests/karma.conf.js

clean:
	rm node_modules -rf
	rm bower_components -rf

.PHONY: update 
