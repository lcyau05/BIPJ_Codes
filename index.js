const express = require('express') //importing the express library for use
const app = express() //initialise the express class with a variable name app
const bodyParser = require('body-parser'); //import body-parser to use and named it as bodyParser
const exphbs = require('express-handlebars'); //importing the express handlebars
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const path = require('path');
// Routes
const mainRoute = require('./routes/main');
const userRoute = require('./routes/user_routes');
const db = require('./config/db');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs'); //for password encryption
const passport = require('passport');
const genwiseDB = require('./config/DBConnection'); //bring in database connection
const methodOverride = require('method-override');
//connects to MySQL database
genwiseDB.setUpDB(false); //To set up database with new tables set (true)

//passport config
//const authenticate = require('./config/passport')
//authenticate.localStrategy(passport);

app.use(bodyParser.urlencoded({extended:true})); //use the body-parser to parseencoded url data
app.use(bodyParser.json()); //use the body-parser to parse json data
//enables session to be stored using browser's cookie ID
app.use(cookieParser());

//sets handlebars configurations
app.engine('handlebars', exphbs.engine({
    layoutsDir:__dirname+'/views/layouts',
    partialsDir: __dirname + '/views/partials/'
}));

//set our apps to use the handlebars engine
app.set('view engine', 'handlebars');

// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, 'public')));

// Session Store Configuration
const sessionStoreOptions = {
    host: db.host,
    port: db.port,
    user: db.username,
    password: db.password,
    database: db.database,
    clearExpired: true,
    //how frequently expired sessions will be cleared; milliseconds:
    checkExpirationalInterval: 900000,
    //the maximum age of a valid session; milliseconds:
    expiration: 900000
};
const sessionStore = new MySQLStore(sessionStoreOptions);

// Session Middleware
app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

//initiate passport middleware
// app.use(passport.initialize());
// app.use(passport.session());

// Flash Messages Middleware
app.use(flash());

//Method override middleware to use other HTTP methodsd such as PUT and DELETE
app.use(methodOverride('_method'));

// Middleware to set user object in response locals
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

app.use('/', mainRoute); //mainRoute is declared to point to routes/main.js
app.use('/user', userRoute); //userRoute is declared to point to routes/user_routes.js

app.get('/', (req,res) => {
    res.render('index',{layout:'main'})
});

app.get('/404', (req,res) => {
    res.render('404',{layout:'main'})
});

app.get('/about', (req,res) => {
    res.render('about',{layout:'main'})
});

app.get('/blog', (req,res) => {
    res.render('blog',{layout:'main'})
});

app.get('/contact', (req,res) => {
    res.render('contact',{layout:'main'})
});

app.get('/FAQ', (req,res) => {
    res.render('FAQ',{layout:'main'})
});

app.get('/features', (req,res) => {
    res.render('features',{layout:'main'})
});

app.get('/service', (req,res) => {
    res.render('service',{layout:'main'})
});

app.get('/team', (req,res) => {
    res.render('team',{layout:'main'})
});

app.get('/testimonial', (req,res) => {
    res.render('testimonial',{layout:'main'})
});

//ACCOUNT MANAGEMENT:
app.get('/login', (req,res) => {
    res.render('ACCOUNTS/login',{
        layout:'main'
      });
    });

app.post('/login', (req,res) => {
    let errorsList = [];
    let {email, password} = req.body;
    if (email.length <= 0)
         {
        errorsList.push({text: 'Please Enter Your Email!'});
        }
    if (password.length <= 0)
         {
        errorsList.push({text: 'Please Enter Your Password!'});
        }
});

let port = 3002

//starting the server on the designated port
//no commands will run after this line as the server starts
app.listen(port,() => {
    console.log(`Server is running on port http://localhost:${port}`);
});