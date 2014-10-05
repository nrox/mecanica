
Run tests
---------

start a web server in this repository folder

    #need http-server
    npm install -g http-server

    cd mecanica
    http-server -c -1 -p 8080

tests with the browser. open developer tools to see console.logs

    localhost:8080/tests/three-intro.html
    localhost:8080/tests/test-require.html
    localhost:8080/tests/test-mesh.html
    ...

tests with node.js

    node test-ammo.js all
    node test-three.js all
    ...






