const express = require('express')
const myParser = require("body-parser");
const ejs = require('ejs')
const app = express()
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(myParser.urlencoded({extended : true}));

app.set('view engine', 'ejs');
app.disable('x-powered-by'); //won't report what server is running, recommended for security & doesn't hurt.


app.get('/', function (req, res) {
    res.render("pages/index");
})


app.post('/dbquery',function(req,res){
    
    var pool = new pg.Pool(
	{connectionString:process.env.DATABASE_URL}
    )
    
    // connection using created pool
    pool.connect(function(err, client, done) {
    	client.query('select * from responses', //placeholder query. Assuming 'responses' exists. Remember to sanitize the real thing.
    		     function(err, result){
    			 done();
    			 if (err)
    			 {console.error(err); res.send("Error " + err); }
    			 else
    			 { // response.render('pages/db', {results: result.rows});
    			     res.send("success");
    			 }
    		     });//end query
	done()
    });
    // pool shutdown
    pool.end()
    
    console.log("qmanager"+req.body.qobj);//diag
    
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
