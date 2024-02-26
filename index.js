import express, { query } from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import { Strategy as GoogleStratergy } from "passport-google-oauth20";
import "dotenv/config";

const app = express();
const port = 3000;
const saltRounds = 12;

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

passport.use(

  new GoogleStratergy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
    async (accesToken, refreshToken, profile, cb) => {
      try {

        console.log("user ki profilr ", profile);
        console.log("bahar",profile._json.email);
        const result = await db.query("SELECT * FROM users WHERE email = $1",[profile._json.email]);
        if(result.rows.length === 0){
        storeEmail =   profile._json.email;
          console.log("yes",profile.email);
          const newUser = await db.query("INSERT INTO  users(email,password) VALUES($1,$2) RETURNING*",[profile._json.email,"google"]);
          console.log(newUser.rows[0])
          return cb(null,newUser.rows[0]);
        }else{  
          return cb(null,result.rows[0]);
        }
      } catch (err) {
        console.log(err);
      }
    }
  )
)

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("SELECT secret FROM users WHERE email=$1",[req.user.email]);
   let mySec = "there is no secret of mine";
    if(result.rows[0].secret){
       mySec = result.rows[0].secret;
    }
    res.render("secrets.ejs",{
      MYsecret: mySec,
    });
  } else {
    res.render("login.ejs");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    console.log("pehle\n");
    const exists = await db.query("SELECT *FROM users WHERE email = $1", [
      email,
    ]);

    await bcrypt.hash(password, saltRounds + 1, async (err, hash) => {
      if (exists.rows[0]) {
        console.log(exists.rows);
        res.json("User Already exists Try to login");
      } else {
        await db.query("INSERT INTO users(email,password) VALUES($1,$2)", [email, hash]);
        console.log(hash);
        res.redirect("/secrets");
      }
    })

  } catch (error) {
    console.log(error.message)
  }

});

app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
)

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }else{
    res.redirect("/");
    }
  });
});


//-------creating a submit button route-----------------//
app.get("/submit", async (req,res)=>{
    if(req.isAuthenticated()){
      res.render("submit.ejs");
    } else {
      res.redirect("/login");
    }
});

app.post("/submit", async (req,res)=>{
     console.log(req.body.secret);
     const sec  =  req.body.secret;
     await db.query("UPDATE users SET secret =$1 WHERE email = $2",[sec,req.user.email]);
     res.redirect("/secrets")
})

let storeEmail;
async function fun(){
    await db.query("DELETE FROM users WHERE password = 'google'");
}

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    console.log(username);
    try {

      const exists = await db.query("SELECT* FROM users WHERE email = $1", [username]);
      if (exists.rows[0]) {
        const users = exists.rows[0]
        const storeshashedpassword = exists.rows[0].password;
        bcrypt.compare(password, storeshashedpassword, (err, result) => {
          if (err) {
            console.log(err);
            return cb(err);
          } else {
            if (result) {
              return cb(null, exists.rows[0]);
            } else {
              return cb(null, false);
            }
          }
        })

      } else {
        return cb("User not found");
      }

    } catch (err) {
      console.log(err);

    }

  })
);

async function start() {

  await db.connect();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

}

start();