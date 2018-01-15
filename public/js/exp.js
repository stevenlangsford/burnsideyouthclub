var ppntID = Math.round(Math.random()*10000000);
localStorage.setItem("ppntID",ppntID); //cookie alternative, retrive with localStorage.getItem("ppntID"). Only stores strings. Privacy-preserving session tagging.

var trialindex = 0;

function responseListener(aresponse){//global so it'll be just sitting here available for the trial objects to use. So, it must accept whatever they're passing.
//    console.log("responseListener heard: "+aresponse); //diag
    
    $.post('/response',{questionid:trials[trialindex].questionid,myresponse:aresponse,sessionID:localStorage.getItem("ppntID")},function(success){
    	console.log("Logging "+aresponse+":"+success);//For now server returns the string "success" for success, otherwise error message.
    });
    
    // //can put this inside the success callback, if the next trial depends on some server-side info.
    //    console.log(aresponse);//dev version
    trialindex++; //increment index here at the last possible minute before drawing the next trial, so trials[trialindex] always refers to the current trial.
    nextTrial();
}

function nextTrial(){
    document.getElementById("surveyprogress").innerHTML="Question "+(trialindex+1)+" of "+trials.length;
    if(trialindex<trials.length){
	trials[trialindex].drawMe("uberdiv");
    }else{
	$.post("/finish",function(data){window.location.replace(data)});
    }
}


var scrapeAnswers; //each question constructor should set this to a function that collects all the responses, whether they're text or check boxes or whatever qspecific thing, and passes them as one string to responseListener.
//repsonseListener then pushes the string to the database 'responses' table.
var progressButtons = "<br/><button onclick='scrapeAnswers()'>Next</button>"

//constructors for different question types follow: all MUST HAVE a 'drawMe' function, which MUST SET an appropriate scrapeanswers function that passes a string to responseListener, and have something that calls scrapeAnswers (probably progressButtons, but hey, could be something else).

function textbox_question(qtext){ //qtext is a string
    this.questionid=qtext;
	 this.drawMe = function(mydiv){
	     document.getElementById(mydiv).innerHTML = "<h3 class='qmain'>"+qtext+"</h3><br/><textarea id='textboxQ' style='width:500px; class=\"response\"'></textarea>"+progressButtons;

	     scrapeAnswers = function(){
		 responseListener(document.getElementById('textboxQ').value);
	     }
	 }
}

function textboxlist_question(qmain,labellist){ //qmain is a string, labellist is an array of strings
    this.questionid=qmain;
    this.drawMe = function(mydiv){
	var drawstring = "<h3 class='qmain'>"+qmain+"</qmain></br>";
	for(var i=0;i<labellist.length;i++){
	    drawstring+=labellist[i]+"&nbsp<textarea id='qlist"+i+"' style='width:500px; class=\"response"+i+"\"'></textarea></br>";
	}
	drawstring+=progressButtons;
	scrapeAnswers = function(){
	    var responseString = "";
	    for(var i=0;i<labellist.length;i++){
		responseString+=labellist[i]+":"+document.getElementById('qlist'+i).value+"_";
	    }
	    responseListener(responseString);
	}
 	document.getElementById(mydiv).innerHTML = drawstring;
    }//end drawme
}//end textboxlist

function dropdownlist_question(qmain,qoptions){
    this.questionid=qmain;
    this.drawMe = function(mydiv){
	 var drawstring = "<h3 class='qmain'>"+qmain+"</h3></br><select id='ddlist'>";
	 for(var i=0;i<qoptions.length;i++){
	     drawstring+="<option value='"+qoptions[i]+"'>"+qoptions[i]+"</option>";
	 }
	 drawstring+="</select></br>"+progressButtons;

	 scrapeAnswers = function(){
	     responseListener(document.getElementById('ddlist').value);
	 }
	 document.getElementById(mydiv).innerHTML = drawstring;
     }
}

function checkboxes_question(qmain,qoptions){
    this.questionid=qmain;
     this.drawMe = function(mydiv){
	 var drawstring = "<h3 class='qmain'>"+qmain+"</h3></br>";
	 for(var i=0;i<qoptions.length;i++){
	     drawstring+="<input type='checkbox' id='checkq"+[i]+"' value='"+qoptions[i]+"'>"+qoptions[i]+"</br>";
	 }
	 drawstring+="Other&nbsp<textarea id='otherans' style='width:500px; class=\"response"+i+"\"'></textarea></br>";
	 drawstring+="</br>"+progressButtons;

	 scrapeAnswers = function(){
	     var responseString = "";
	     for(var i=0;i<qoptions.length;i++){
		 if(document.getElementById('checkq'+i).checked)responseString+=document.getElementById('checkq'+i).value+"_";
	     }
	     if(document.getElementById('otherans').value.length>0)responseString+=" other "+document.getElementById("otherans").value;
	     responseListener(responseString);
	 }
	 document.getElementById(mydiv).innerHTML = drawstring;
     }
}



// function shuffle(a) { //via https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
//     var j, x, i;
//     for (i = a.length - 1; i > 0; i--) {
//         j = Math.floor(Math.random() * (i + 1));
//         x = a[i];
//         a[i] = a[j];
//         a[j] = x;
//     }
//     return a;
// }
//****************************************************************************************************
//Stimuli
var trials = [new textbox_question("How did you find out about Burnside Youth Club?"),
	      new textbox_question("What do you consider to be our club's strengths?"),
	      new textbox_question("How many other sporting / artistic / educational sessions do you attend after hours or on weekends each week?"),
	      new textbox_question("Do you have any suggestions that would help our club to attract more new members?"),
	      new textbox_question("Do you have any suggestions that would help our club to keep current members longer? "),
	      new textbox_question("Is there anything you would like our club to do differently? "),
	      new textboxlist_question("Where would you prefer our training venue to be located? (Name four preferred suburbs).",["Preference 1","Preference 2","Preference 3","Preference 4"]),
	      new textbox_question("Which training activities do you enjoy the most?"),
	      new textbox_question("What do you need to work on the most to improve your skills in this sport?"),
	      new textbox_question("What do you like about this sport?"),
	      new textbox_question("What don't you like about this sport?"),
	      new textboxlist_question("How many training sessions would you prefer to attend each week?",["Maximum","Minimum"]),
	      new dropdownlist_question("Which one of the following levels of achievement best indicates your goal in this sport?",
					["Achieving a few key skills as a recreational participant",
					 "Achieving a wide range of skills as a recreational participant",
					 "Compete as a club team member in South Australian competitions",
					 "Represent South Australia at the Australian Championships",
					 "Represent Australia in international competitions"
					]),
	      new checkboxes_question("Are you interested in undertaking other roles in the sport either now or in the future? (Select any that apply)",
				      ["Coaching",
				       "Judging/refereeing",
				       "Administration",
				       "Management"]),
	      new textbox_question("Is there any other comment or suggestion you'd like to make?")
	     ];
//trials = stim.map(function(x){return new makeTrial(x)});

//nextTrial(); //now on a button on survey.ejs page, which has  preamble message.
