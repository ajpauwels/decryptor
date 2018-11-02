# Decryptor ![Build status](https://travis-ci.com/ajpauwels/decryptor.svg?branch=master)

The decryptor component receives requests to localhost for encrypted data, retrieves that data from an appropriate storage solution, and then returns it in a secured iframe for display on the original webpage.

The general flow is this:

1. User visits website, let's call it acme.com (this website can be HTTP or HTTPS, it doesn't matter).

2. The website creator has added iframes throughout the page where private data should be displayed. For example, to display the user's first name, an iframe with a URL of https://localhost:3000/firstName is placed (see Appendix A for discussion of ports).

3. When the page loads, the request is received by decryptor listening to localhost:3000

4. The decryptor requests the encrypted data from whichever storage it uses, decrypts it, and returns an HTML document containing the information (which is itself in an iframe, part of the double-buffered iframe system which is described in Appendix B). The displayed data is unreadable by the original webpage.

### Requirements
1. You'll need NodeJS, preferably v8 or greater (that's what it was tested on).

### Setup
1. Clone this repository locally using `git clone git@github.com:ajpauwels/decryptor.git`

2. Enter the directory with `cd decryptor`

3. Run `npm install`

4. This app configures itself using environment variables, sample env files can be found inside of `tests/env`. To do development/debug the app, you can run `source tests/env/dev.env`. If tests are being run, you should run `source tests/env/testing.env`. The only env you will need to likely change is `STORAGE_URL`, which you'll need to be correct for development purposes. Point it to the URL of your desired storage API. An explanation of each env is provided in Appendix C.

5. Run the app using `npm run watch-ts`

6. You'll need to add the CA chain as a trusted CA either in your OS's trusted CA store, or in your browser's list of trusted CAs. For development purposes, I highly recommnd just placing the CA chain inside your browser. It's easy to add and remove and you won't accidentally let a TLS cert meant for development sit around trusted by your entire OS. To do so varies per browser, but generally go to settings, find some sort of security tab, and you should see a button with the word "certificates" in it. Whatever window that opens should have some way to add new certs, at which point you can browse to the `tests/tls/intermediate.root.cert.pem` file and add it. 

### Usage
You can load a piece of information simply by going to a localhost URL, exactly the same way a website would place the URL inside an iframe. Go to https://localhost:3000/firstName to see the `firstName` field in your storage displayed.

### Unit tests
The package.json scripts look daunting but in fact follow a very simple pattern which ease testing various components of the app.

1. To simply run the tests and see if they pass, run `npm run test`.

2. To run the tests and get the code-coverage, run `npm run test+cov`.

3. To run just one test file, run `npm run test-some tests/path/to/test/file`.

4. To run just one test file and get the code coverage for that file, run `npm run test+cov-some tests/path/to/test/file`.

5. If a command has `watch-` prefixed to it, the command runs and then watches for changes in files in the project, re-running the command if a change is detected; very useful for development.

### Future Development: Input System
Ideally, a website should be able to leverage decryptor to provide secured user input to the user's storage. This is a WIP.

### Appendix A: Custom ports
Unfortunately, it's hard to guarantee one port that will work on 100% of all user systems. You can use a very unlikely to be used port, but even then, there's a slim chance some system is unable to use that port to listen on, as another service may be using it. In such cases, browser extensions, or native browser settings, could set a user-defined port and rewrite iframe requests to localhost to use that port.

### Appendix B: Double-buffered/secure iframes
To be useful, the decryptor must be able to display the decrypted information without the hosting webpage being able to read that information. Although simply displaying the information in an iframe is already enough to make the information inaccesible, it doesn't stop the host webpage to write some client-side JS that performs an AJAX request to the localhost URL and retrieve the contents of that response. This is where the double-buffered iframe comes in.

When the request is made to localhost, the decryptor does not actually send back the raw information requested. It performs the following steps:
1. Generates a random token

2. Sets the token in the user's local session

3. Returns an HTML page which itself contains an iframe that points to localhost but with a path that looks like `/secure/<info path>?iframeToken=<generated token>`.

4. The `/secure` path receives the request, pulls both the session token and the query token, ensures that they match, and then serves up the raw data.

The purpose of the double-buffered iframe is to ensure that the underlying data is ONLY displayed when it knows that it is contained within an iframe; if a direct AJAX or browser request is made to the `/secure` endpoint, then no information is displayed.

The way this works is due to the combination of a session and query token. The token is only generated and set by the standard, non-secure localhost URL. Therefore, if a direct request is made, the token is not generated and the session not set, so nothing is displayed. If the webpage host decides to be clever, makes a request to the non-secure URL, gets the iframe with the query token, extracts the query token, and then makes a request to the `/secure` endpoint with the query token, that still won't work, as that request won't have a session cookie containing that same token.

### Appendix C: Explanation of env variables
1. SERVER\_KEY: A private key used for mutual TLS communication. For testing purposes, you can use the pre-packaged TLS key provided in the test folder at `tests/tls/server.key.pem`. Note that this should be the actual key, not a path to the key.

2. SERVER\_CERT: The public certificate that goes with the SERVER\_KEY. You can find one at `tests/tls/server.cert.pem`. This should be the actual cert, not a path to the cert.

3. SERVER\_CA\_CHAIN: Chain of CAs going from the CA which signed the server cert up to a root CA recognized by the browser. You can find this at `tests/tls/intermediate.root.cert.pem`.

4. CLIENT\_KEY: The user's private key, the same one which was used to encrypt the information sent to storage. It will be used for decrypting that same information. You can find this at `tests/tls/tester.key.pem`.

5. CLIENT\_CERT: The public certificate that goes with the CLIENT\_KEY. Used for mutual TLS authentication to the storage system. You can find this at `tests/tls/tester.cert.pem`.

6. CLIENT\_CA\_CHAIN: Chain of CAs going from the CA which signed the client cert up to the user's root CA cert. You can find this at `tests/tls/intermediate.root.cert.pem`.

7. SESSION\_SECRET: A random token meant to generate session secrets. Can be anything. Should be regularly refreshed.

8. STORAGE\_URL: URL to the storage where information will be retrieved from.

5. (Optional) ZONE: Feel free to specify a zone here for the purposes of deployment, such as dev, staging, prod, or testing environment. This isn't currently used very much but will be used in the future to define log levels.

6. (Optional) PORT: Specify the port you want to run the app on. It currently defaults to 3000, although I usually define this variable to be 3002.
