const express = require('express')
const app = express()
var cors = require('cors')

var fs = require("fs");

const port = process.env.PORT || 8080;

app.use(cors())
app.use(express.json());

// **** //

let DB = {}; // temporary DB

fs.readFile("db.json", function(err, buf) {
    try {
        DB = JSON.parse(buf.toString());
    } catch {
        console.log('err reading Db');
        DB = {};
    }
});

const ALPHA_NUMERIC = 'qwertyuioasdfghjklzxcvbnm1234567890';
const code = '*';

function generateRandomId(size = 12, possibles = ALPHA_NUMERIC) {
    let string = '';

    for (let i = 0; i < size; i++) {
        const randomIndex = Math.floor(Math.random() * possibles.length);
        string = string + possibles[randomIndex];
    }

    return string;
}

app.get('/', (req, res) => {
    res.send({
        success: true,
        text: 'Hello'
    })
})

app.post('/saveText', (request, response) => {
    const text = request.body.text;
    const password = request.body.password;

    const randomId = generateRandomId();

    if (password) {
        DB[randomId] = {
            text,
            password,
            havePasword: true
        };
    } else {
        DB[randomId] = {
            text,
            havePasword: false
        };
    }

    response.status(200).send({
        success: true,
        textId: randomId
    });

    console.log('DB', DB);
})

// app.post('/needPassword', (res, req) => {
//     const textId = req.body.textId;

//     const textObj = DB[textId];

//     if (!textObj) {
//         return res.status(200).send({
//             success: false,
//             error: true,
//             mssg: 'Text does not exist.'
//         });
//     }

//     return res.status(200).send({
//         success: true,
//         needPassword: textObj.havePasword
//     });
// });

app.post('/getText', (req, res) => {
    const textId = req.body.textId;
    const password = req.body.password;

    const textObj = DB[textId];

    if (!textObj) {
        return res.status(200).send({
            success: false,
            error: true,
            mssg: 'Text does not exist.'
        });
    }

    if (password) {
        if (password === textObj.password) {
            return res.status(200).send({
                success: true,
                text: textObj.text,
            });
        } else {
            return res.status(200).send({
                success: false,
                error: true,
                mssg: 'Password mismatch'
            });
        }
    } else {
        if (textObj.havePasword) {
            return res.status(200).send({
                success: false,
                passwordRequired: true
            });
        } else {
            return res.status(200).send({
                success: true,
                text: textObj.text,
            });
        }
    }
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})


function onExitSaveDatabaseToDisk() {
    process.stdin.resume(); //so the program will not close instantly

    function exitHandler(options, exitCode) {
        fs.writeFileSync("db.json", JSON.stringify(DB));
        process.exit();
    }

    //do something when app is closing
    process.on('exit', exitHandler.bind(null, { cleanup: true }));

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, { exit: true }));

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
    process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

}

onExitSaveDatabaseToDisk();