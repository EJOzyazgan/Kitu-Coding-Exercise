let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');

let app = express();

const axios = require('axios');
const fs = require('fs');


const userPath = './users.json';

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.get('/users', async (req, res) => {
    let users = getUsers();

    if (users === null) {
        return res.status(400).json({message: 'Error loading users'});
    }

    let allUsers = users.length;
    let newUsers = 10;
    const url = 'https://randomuser.me/api';

    for (let i = 0; i < newUsers; i++) {
        axios.get(url).then(response => {
            const data = response.data.results[0];
            let user = {
                gender: data.gender,
                firstname: data.name.first,
                city: data.location.city,
                email: data.email,
                cell: data.cell
            };

            users.push(user);

            if (users.length === allUsers + newUsers) {
                if (!saveUsers(users))
                    return res.status(400).json({message: 'Error saving user'});
                return res.status(200).send(users);
            }
        }).catch(err => {
            return res.status(400).json({message: 'Error getting users'});
        });
    }
});

app.post('/users', async (req, res) => {
    let users = getUsers();
    users.push(req.body);
    if (saveUsers(users))
        return res.status(201).json({message: 'User successfully created!'});
    return res.status(400).json({message: 'Error saving user'})
});

app.get('/users/firstname/:firstname', async (req, res) => {
    let firstName = req.params.firstname;
    let users = getUsers();

    for (let user of users)
        if (user.firstname === firstName)
            return res.status(200).json(user);

    return res.status(404).json({message: 'User not found!'});
});

function getUsers() {
    try {
        if (fs.existsSync(userPath))
            return JSON.parse(fs.readFileSync(userPath, 'utf8'));
        return [];
    } catch (err) {
        console.error(err);
        return null;
    }

}

function saveUsers(users) {
    try {
        fs.writeFileSync(userPath, JSON.stringify(users));
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
