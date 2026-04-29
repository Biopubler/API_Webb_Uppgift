// Från Holger
//1. Ändra POST /users så att lösenord lagras i krypterad form (tror att du har gjort detta i en annan version av ditt serverskript).
//2. Lägg till en route POST /login som returnerar en token (JWT) ifall man anger korrekt användarnamn+lösenord (jämför krypterat lösenord med det som finns i databasen).
//3. Ändra GET /users, GET /users/{id} och POST /users så att de ger felmeddelande ifall det inte finns en token som kan avkodas i klientens förfrågan (klistra in i Auth -> Bearer token i Insomnia).

let express = require("express"); // INSTALLERA MED "npm install" I KOMMANDOTOLKEN
let app = express();
app.listen(3000);
console.log("Servern körs på port 3000");

const crypto = require("crypto"); //inbyggt in Nodes standardbibliotek, kräver ej installation
function hash(data) { // "data" är indata för hashningen, t.ex. ett lösenord i klartext
  const hash = crypto.createHash("sha256"); // sha256 är en specifik hashningsalgoritm
  hash.update(data);
  return hash.digest("hex");
}

// importera jsonwebtoken och tilldela hemlig nyckel
const jwt = require("jsonwebtoken"); // installera med "npm install jsonwebtoken"
const secret = "EnHemlighetSomIngenKanGissaXyz123%&/";




app.get("/", function (req, res) {
  res.sendFile(__dirname + "/dokumentation.html");
});

const mysql = require("mysql"); // INSTALLERA MED "npm install" I KOMMANDOTOLKEN
con = mysql.createConnection({
  host: "localhost", // databas-serverns IP-adress
  user: "root", // standardanvändarnamn för XAMPP
  password: "", // standardlösenord för XAMPP
  database: "webbserverprogrammering", // ÄNDRA TILL NAMN PÅ ER EGEN DATABAS
});

app.use(express.json());

const COLUMNS = ["firstname", "lastname", "userId", "passwd"]; // ÄNDRA TILL NAMN PÅ KOLUMNER I ER EGEN TABELL

// grundläggande exempel - returnera en databastabell som JSON
app.get("/users", function (req, res) {
   let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
    res.sendStatus(400); // "Bad request"
    return;
  }
  let token = authHeader.slice(7); // tar bort "BEARER " från headern.
  // nu finns den inskickade token i variabeln token
  console.log(token);

  // avkoda token
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    console.log(err); //Logga felet, för felsökning på servern.
    res.status(401).send("Invalid auth token");
    return;
  }
  let sql = "SELECT * FROM users"; // ÄNDRA TILL NAMN PÅ ER EGEN TABELL (om den heter något annat än "users")
  let condition = createCondition(req.query); // output t.ex. " WHERE lastname='Rosencrantz'"
  console.log(sql + condition); // t.ex. SELECT * FROM users WHERE lastname="Rosencrantz"
  // skicka query till databasen
  con.query(sql + condition, function (err, result, fields) {
    res.send(result);
  });
});

let createCondition = function (query) {
  // skapar ett WHERE-villkor utifrån query-parametrar
  console.log(query);
  let output = " WHERE ";
  for (let key in query) {
    if (COLUMNS.includes(key)) {
      // om vi har ett kolumnnamn i vårt query
      output += `${key}="${query[key]}" OR `; // t.ex. lastname="Rosencrantz"
    }
  }
  if (output.length == 7) {
    // " WHERE "
    return ""; // om query är tomt eller inte är relevant för vår databastabell - returnera en tom sträng
  } else {
    return output.substring(0, output.length - 4); // ta bort sista " OR "
  }
};

// route-parameter, dvs. filtrera efter ID i URL:en



app.get("/users/:id", function (req, res) {
   let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
    res.sendStatus(400); // "Bad request"
    return;
  }
  let token = authHeader.slice(7); // tar bort "BEARER " från headern.
  // nu finns den inskickade token i variabeln token
  console.log(token);

  // avkoda token
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    console.log(err); //Logga felet, för felsökning på servern.
    res.status(401).send("Invalid auth token");
    return;
  }
  // Värdet på id ligger i req.params
  let sql = "SELECT * FROM users WHERE id=" + req.params.id;
  console.log(sql);
  // skicka query till databasen
  con.query(sql, function (err, result, fields) {
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(404); // 404=not found
    }
  });

});

app.post("/users", function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
    res.sendStatus(400); // "Bad request"
    return;
  }
  let token = authHeader.slice(7); // tar bort "BEARER " från headern.
  // nu finns den inskickade token i variabeln token
  console.log(token);

  // avkoda token
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    console.log(err); //Logga felet, för felsökning på servern.
    res.status(401).send("Invalid auth token");
    return;
  }
  if (!req.body.userId) {
    res.status(400).send("userId required!");
    return;
  }
  let fields = ["firstname", "lastname", "userId", "passwd"]; // ändra eventuellt till namn på er egen databastabells kolumner
  for (let key in req.body) {
    if (!fields.includes(key)) {
      res.status(400).send("Unknown field: " + key);
      return;
    }
  }
  // OBS: näst sista raden i SQL-satsen står det hash(req.body.passwd) istället för req.body.passwd
  // Det hashade lösenordet kan ha över 50 tecken, så använd t.ex. typen VARCHAR(100) i databasen, annars riskerar det hashade lösenordet att trunkeras (klippas av i slutet)
  let sql = `INSERT INTO users (firstname, lastname, userId, passwd)
    VALUES (?, ?, ?, '${hash(req.body.passwd)}')`; // OBS: lösenordet hashas!
  console.log(sql);

  con.query(sql, [req.body.firstname, req.body.lastname, req.body.userId], function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    let output = {
      id: result.insertId,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      userId: req.body.userId,
    }; // OBS: bäst att INTE returnera lösenordet
    res.send(output);
  });
});



app.post("/login", function (req, res) {
  //kod här för att hantera anrop…
  let sql = `SELECT * FROM users WHERE userId=?`;

  con.query(sql, [req.body.userId], function (err, result, fields) {
    if (err) throw err;
    if (result.length == 0) {
      res.sendStatus(401);
      return;
    }
    let passwordHash = hash(req.body.passwd);
    console.log(passwordHash);
    console.log(result[0].passwd);
    if (result[0].passwd == passwordHash) {
      let payload = {
              sub: result[0].userId, //sub är obligatorisk
              name: result[0].firstname, //Valbar information om användaren
              lastname: result[0].lastname,
            };
            let token = jwt.sign(payload, secret);
            res.json(token);
    } else {
      res.sendStatus(401);  // error 401: unauthorized (obehörig)
    }
  });
});

// funktion för att kontrollera att användardata finns
function isValidUserData(body) {
  return body && body.userId; // returnerar true ifall data är OK, false ifall något av attributen är undefined
  /* andra möjligheter (anpassa efter era egna behov):
        - kolla att firstname, lastname och passwd är textsträngar (snarare än tal, fält osv.)
        - kolla att userId är en textsträng med rätt format (fyra bokstäver motsvarande första två i fornamn + efternamn)
        - kolla att passwd uppfyller vanliga kriterier (minimilängd, innehåller olika typer av tecken osv.)
        - (kolla att userId inte redan är upptaget - eventuellt bättre att kolla detta i samband med att man skriver till databasen genom att göra denna kolumn till key i databastabellen)
    Returnera gärna ett felmeddelande istället för bara false ifall det finns ett fel, så att användaren kan göra rätt vid nästa försök
    */
}

// PUT-ROUTE
app.put("/users/:id", function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
    res.sendStatus(400); // "Bad request"
    return;
  }
  let token = authHeader.slice(7); // tar bort "BEARER " från headern.
  // nu finns den inskickade token i variabeln token
  console.log(token);

  // avkoda token
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    console.log(err); //Logga felet, för felsökning på servern.
    res.status(401).send("Invalid auth token");
    return;
  }
  //kod här för att hantera anrop…
  // kolla först att all data som ska finnas finns i request-body
  // i ett PUT-anrop måste hela "raden" finnas med, alltså alla attribut för en användare!
  if (!(req.body && req.body.firstname && req.body.lastname && req.body.userId && req.body.passwd)) {
    // om data saknas i body
    res.sendStatus(400);
    return;
  }
  let sql = `UPDATE users 
        SET firstname = ?, lastname = ?, userId = ?, passwd = ?
        WHERE id = ?`; // De tre frågetecknen ersätts i query-anropet nedan av värden från req-objektet med data från klienten

  con.query(
    sql,
    [req.body.firstname, req.body.lastname, req.body.userId, req.body.passwd, req.params.id],
    function (err, result) {
      if (err) {
        throw err;
        //kod här för felhantering, skicka felmeddelande osv.
      } else {
        // meddela klienten att request har processats OK
        res.sendStatus(200);
      }
    }
  );
});

