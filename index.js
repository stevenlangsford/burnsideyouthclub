const express = require('express');
const myParser = require("body-parser");
const ejs = require('ejs');
const app = express();
const pg = require('pg');
const session = require('client-sessions');
const json2csv = require('json2csv');
const helmet = require('helmet'); //minimal security best practices. Sets HTTP headers to block first-pass vulnerability sniffing and clickjacking stuff.
//See: https://github.com/helmetjs/helmet
//Also: https://expressjs.com/en/advanced/best-practice-security.html
const favicon = require('serve-favicon')

//App settings:
app.use(favicon(__dirname + '/public/byc.ico')); //You might want to change this.

app.use(session({
  cookieName: 'session',
  secret: 'myp22etr5a2bbit2sb6arki3n4gisgo0n0n9awak3et7he5h3ors1ei5n4theb1aseme24ndt',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(myParser.urlencoded({extended : true}));
app.use(helmet()); //default settings, can customize here.
app.set('view engine', 'ejs');

//data viewing routes: with basic login mechanism
//requirelogin is applied to getdemographics and getresponses (which download data csvs)
function requireLogin (request, response, next) {
    if (request.session.authtoken) {
	next();
    } else {
	response.render('pages/dashboard',{auth:"notyet"});
    }
};

app.post('/login',function(req,res){
    if(req.body.token=="headlessillawonga")req.session.authtoken=true; //set session token
    return res.status(200).send("/dashboard"); //dashboard checks if session token is set
//    res.render("pages/dashboard",{auth:"true"});
});

app.get("/dashboard",function(req,res){
    if(req.session.authtoken){
	res.render('pages/dashboard',{auth:"ok"});}
    else{
	res.render('pages/dashboard',{auth:"notyet"});
    }
});


app.get("/getresponses",requireLogin,function(req,res){
    var pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
    console.log("flag1");
    pool.connect(function(err,client,done){
	console.log("flag2");
	client.query('select * from responses',function(err,result){
	    if(err){
		{console.error("flag3"+err); res.send("Error "+err);}
	    }else{
		console.log("flag4")
		    //TODO do something sensible if there are no results!
		var fields = ["time","sessionid","response"];
		var responses = [];
		for(var i=0;i<result.rowCount;i++){
		    responses.push({time:result.rows[i].time, sessionid:result.rows[i].sessionid,response:result.rows[i].response});
		}
		    var response_csv = json2csv({data: responses, fields:fields}); //this may be an unholy way to create a csv. It evolved. Sorry.
		    res.attachment("responsedata.csv");
		    res.send(response_csv);
		}
	});//end query
    });
    pool.end();
    console.log("flag 5")
});


//should collapse this and getresponses into one getData and pass it the target table name? Two issues with that, differing col names in the db and getting file-save prompts from the client page.
// app.get("/getdemographics",requireLogin,function(req,res){
//     var pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
//     pool.connect(function(err,client,done){
// 	client.query('select * from demographics',function(err,result){
// 	    if(err){
// 		{console.error(err); res.send("Error "+err);}
// 		}else{
// 		    //TODO do something sensible if there are no results!
// 		    var fields = Object.keys(JSON.parse(result.rows[0].demoobj));
// 		    var responses = [];
// 		    	   for(var i=0;i<result.rowCount;i++){
// 			       responses.push(JSON.parse(result.rows[i].demoobj));
// 			   }
// 		    var response_csv = json2csv({data: responses, fields:fields});
// 		    res.attachment("demographicsdata.csv");
// 		    res.send(response_csv);
// 		}
// 	});//end query
//     });
//     pool.end();    
// });



//participant-facing routes for rending pages, including 'index'.
app.get('/', function (req, res) {
    res.render("pages/index");
   
})

app.get('/survey',function(req,res){
    res.render("pages/survey");
});

app.get('/done',function(req,res){
    res.render("pages/outro");
});
app.post('/finish',function(req,res){
    return res.status(200).send("/done");//Another instance of the double-bounce to render. Why?
});

//Participant data-saving routes, push stuff to the database (but don't render new pages.)
// app.post('/demographics',function(req,res){
// //save the response in db
//     var pool = new pg.Pool(
// 	{connectionString:process.env.DATABASE_URL}
//     )    
//     // connection using created pool
//     pool.connect(function(err, client, done) {
//     	client.query('insert into demographics values ($1, $2)', //Probably a crime to save a multi-value objs in one 'info' col. Oh well.
// 		     [Date.now(),
// 		     req.body.demographics],
//     		     function(err, result){
//     			 if (err)
//     			 {console.error(err); res.send("Error " + err); } //For now the client just prints the error to the console. What's ideal?
//     			 else
//     			 { // response.render('pages/db', {results: result.rows});
//     			     res.send("success");
//     			 }
//     		     });//end query
// 	done();
//     });
//     pool.end()
// });


app.post('/response',function(req,res){
//save the response in db
    var pool = new pg.Pool(
	{connectionString:process.env.DATABASE_URL}
    )    
    // connection using created pool
    pool.connect(function(err, client, done) {
    	client.query('insert into responses values ($1,$2,$3)', //NOTE this assumes table responses exists with cols 'time', 'ppntid' 'response_string'
		     [Date.now(),
		      req.body.sessionID,
		      req.body.myresponse],
    		     function(err, result){
    			 if (err)
    			 {console.error(err); res.send("Error " + err); } //For now the client just prints the error to the console. What's ideal?
    			 else
    			 { // response.render('pages/db', {results: result.rows});
    			     res.send("success");
    			 }
    		     });//end query
	done();
    });
    pool.end()
});



//Ok, run this thing!
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
